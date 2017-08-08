# <a href="https://github.com/frontful/frontful-queue"><img heigth="75" src="http://www.frontful.com/assets/packages/queue.png" alt="Frontful Queue" /></a>

`frontful-queue` is configurable message queue micro service focused on sequential processing of jobs i.e sets of tasks. For monitoring queue use [`frontful-queue-monitor`](https://github.com/frontful/frontful-queue-monitor) or exposed [`frontful-queue` API](https://github.com/frontful/frontful-queue#api)

### Mechanics

Jobs and tasks are added and configured by modifying [`config.js`](https://github.com/frontful/frontful-queue/blob/master/config.js). For more details on configuration schema read [Configuration](https://github.com/frontful/frontful-queue#configuration) section.

  - **Jobs** - Job is an entry point e.g. `http://localhost:7010/sample/job/foobar` that `frontful-queue` exposes based on its configuration to accept POST requests with JSON messages. Each job will have its own entry point. When message is received, new job instance i.e [**state**](https://github.com/frontful/frontful-queue#state) is created and message becomes part of it. State then is saved in **store** and response is sent to caller containing current state. Note that response indicates that **message is queued, processing has not started yet**. Queued state gets picked up by **processor** from store. State then gets passed to sequence of job tasks. When all tasks succeed job is marked as completed, if one task fails job is marked as failed. All changes are reflected in state, state is mutated and saved to the store. Jobs and tasks can be managed (edited and resent in the future) using [`frontful-queue-monitor`](https://github.com/frontful/frontful-queue-monitor) or [`frontful-queue` API](https://github.com/frontful/frontful-queue#api).
  - **Tasks** - Task is an endpoint that represents external worker or business logic that accepts HTTP POST request with JSON message. Job consists of multiple tasks. Task `message()` method receives **state** to construct outgoing message. Simplest outgoing message can be constructed like `message: state => state.message` i.e original message that jobs entry point received will be set as outgoing message for this task. Constructing outgoing messages from state means that it is integral for subsequent tasks to access responses from previous tasks e.g. `message: state => ({id: state.get('tasks.0.response.id')})`.
  - [**State**](https://github.com/frontful/frontful-queue#state) - State is JSON object that contains all information about particular job instance, its tasks and incoming and outgoing messages. State is used to construct outgoing task `message`s and job `tags`, accessing responses and status as well as building integrations using `frontful-queue` API.
  - **Processor** - Processor is responsible for job and task execution, sequence, polling as well as terminating tasks that may potentially have timed out.
  - **Triggers** - Trigger is special endpoint that is called based on specified time interval. This can be useful to regularly trigger some endpoint that in turn may result in POST requests to jobs entry point.
  - **Store** - Store is message queue persistence layer, storage can be MSSQL, MySQL, Postgres, SQLite or memory. Storage abstraction is provided by [Sequelize](http://docs.sequelizejs.com/).

### Configuration

Jobs and tasks are added and configured by modifying [`config.js`](https://github.com/frontful/frontful-queue/blob/master/config.js). `config.js` can be modified and replaced after production build. Jobs, tasks, processor, triggers and store are configured there.

- **`server.active`** - Whether processor and triggers are active. If `true` `frontful-queue` is fully functional, if `false` processor and triggers are disabled. API is accessible in all cases.
- **`server.store`** - Contains store configuration attributes.
  - **`server.store.connection`** - Describes connection to store for `frontful-queue`. Access to store is provided by [Sequelize](http://docs.sequelizejs.com/), attributes that are available for `server.store.connection` can be found in [reference of sequelize constructor](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor). Dialect is mandatory and depending on what store dialect you chose, you need to install [corresponding dialect provider](http://docs.sequelizejs.com/manual/installation/getting-started.html#installation) e.g. `yarn add sqlite3` to support `sqlite` dialect.
  - **`server.store.table`** - Table where queue state will be saved. Table will be created automatically.
- **`server.trigger`** - Key is endpoint that will be called with GET method, value is time interval in milliseconds after which trigger will be called again e.g. `{'http://localhost:7010/sample/trigger': 1000 * 30}`. This will result in GET calls to `http://localhost:7010/sample/trigger` every 30 seconds.
- **`server.processor`** - Configuration parameters for queue processor.
  - **`server.processor.interval`** - How often processor should poll store for queued jobs.
  - **`server.processor.timeout`** - Time in milliseconds for setting task as being timed out. If processing of task takes more that `server.processor.timeout`, task will be marked as failed due to timeout.
- **`server.jobs`** - Configuration of `frontful-queue` jobs i.e sets of tasks.
  - **`server.jobs.name`** - Name of the job, should be unique among other jobs.
  - **`server.jobs.path`** - Path that `frontful-queue` will mount and listen on for POST requests with JSON message. Path is absolute e.g. if path is defined as `/sample/job/foobar` and service is running under `http://localhost:7010`, then mounted path will be `http://localhost:7010/sample/job/foobar`.
  - **`server.jobs.tags`** - Function that accepts **state** and must return array with up to 7 items. These items will be spread and saved as values in columns `tag01` to `tab07` of store table for potentially optimized data filtering. `tags: state => [state.get('message.id')]`. `tags(state)` function is called each time state of a job changes, it is suggested to use `state.get(path)` method to access its properties, if any part of the state does not yet exist `state.get()` will return null instead of `null` exception.
  - **`server.jobs.tasks`** - Array for task definition objects.
    - **`server.jobs.tasks[].name`** - Name of the tasks, must be unique among job tasks.
    - **`server.jobs.tasks[].url`** - Full url of resource that represents actual worker or business logic that accepts POST request with JSON message.
    - **`server.jobs.tasks[].message`** - Function that constructs message that will be sent to specified tasks url. Function accepts **state** and return JSON object e.g. `message: state => state.message`.

### State

State is JSON object that contains all information about particular job instance, its tasks and incoming and outgoing messages. State is used to construct outgoing task `message`s and job `tags`, accessing responses and status as well as building integrations using `frontful-queue` API.  
Note that state is mutated during job processing, below is state outline for when job that has completed successfully, when state is just created, or tasks not started some values may be `null` e.g. `modified` or `response`.

```javascript
{
  "id": "5cf0e5d9-e82e-4377-a418-1d73f5abd061", // Id of Job instance ie. state
  "name": "sample_job_foobar", // Name of the job
  "message": {...}, // JSON message that was received by job entry point
  "origin": "external", // Whether state originated from `external` caller or `internal` resend
  "status": "success", // Job status `queued|processing|success|error`
  "status_details": "", // Status details in case of an error
  "created": 1502113270560, // Date created in UTC milliseconds
  "modified": 1502113272115, // Date modified in UTC milliseconds
  "tasks": [ // Array containing job tasks and their details
    {
      "name": "sample_task_foo", // Name of the task
      "message": {...}, // Message that was sent as request to task endpoint url
      "response": {...}, // Response message received from task endpoint url
      "modified": 1502113271990, // Date modified in UTC milliseconds
      "status": "success" // Task status `queued|processing|success|error`
    },
    ...
  ]
}
```

### API

#### Utilities

  - `state` - `state` object is passed to `message()` method for task and `tags()` method for job. All [state attributes](https://github.com/frontful/frontful-queue#state) can be accessed directly e.g. `state.tasks[0].response.id`. `state` also has `state.get(path)` method that accepts attribute path e.g.  `state.get('state.tasks.0.response.id')`, difference is in that `state.get(path)` will return `null` if path is not found instead of throwing exception when accessing attributes of `undefined` or `null`.

#### REST

  - `GET /api/jobs` - Returns 100 latest jobs i.e states from store. Available query parameters are:
    - `count` default `100`
    - `page` default `1`
    - `search` default `null`
  - `GET /log` - returns most recent application logs

### Installation

```shell
# Install yarn package manager
npm install yarn -g
# Install dependencies
yarn install
# Install store dialect provider, default store configuration uses sqlite
# http://docs.sequelizejs.com/manual/installation/getting-started.html#installation
yarn add sqlite3
```

### Development
1. [Install dependencies and store dialect](https://github.com/frontful/frontful-queue#installation)
2. `yarn start` to start service ([http://localhost:7010](http://localhost:7010) by default)
3. Change code, service gets rebuilt and restarted automatically
4. To monitor queue start [`frontful-queue-monitor`](https://github.com/frontful/frontful-queue-monitor) app ([http://localhost:7015](http://localhost:7015) by default)

### Deployment

Keep in mind that `frontful-queue` uses store polling, this means that whatever production deployment mechanism you chose **service must not scale** i.e **there should be only one instance running of particular `frontful-queue` configuration**. If multiple instances of same `frontful-queue` configuration is running, it may result in one message processed multiple times.

- `yarn package` to create `.zip` package.
- Move `.zip` package to host environment, and extract its content.
- [Install dependencies and store dialect](https://github.com/frontful/frontful-queue#installation)
- `yarn build` to build the service
- To start the service
  - Linux - `PORT=7010 node ./build/server`
  - Windows - `./node_modules/.bin/cross-env PORT=7010 node ./build/server`

#### Linux

On Linux use any deployment strategy e.g. started directly from console, using [Nginx](https://nginx.org/en/), [Passenger](https://www.phusionpassenger.com/) etc. but keep in mind that there should be only one process running.

#### Windows

On Windows you can either start service directly from console or install it as windows service using `yarn deploy` command.

```shell
./node_modules/.bin/cross-env PORT=7010 yarn deploy
```
