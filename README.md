# <a href="https://github.com/frontful/frontful-queue"><img heigth="75" src="http://www.frontful.com/assets/packages/queue.png" alt="Frontful Queue" /></a>

`frontful-queue` is message queue like micro service focused on sequential processing of jobs with multiple tasks. For monitoring `frontful-queue` use [`frontful-queue-monitor`](https://github.com/frontful/frontful-queue-monitor) or exposed [API](https://github.com/frontful/frontful-queue#api).

### Mechanics

`frontful-queue` is configured and new jobs and tasks are added by modifying `config.js` file. For more details on configuration schema read [Configuration](https://github.com/frontful/frontful-queue#configuration) section.  
`frontful-queue` consists of six elements
  - **Jobs** - Job is an endpoint e.g. `http://localhost:7010/sample/job/foobar` that `frontful-queue` exposes based on its configuration to accept JSON messages via HTTP POST request. When message is received, new job instance **state** is created and message becomes part of it. State then is saved in **store** and response is sent to caller containing created state. Note that response indicates that **message is queued, processing has not started yet**. Queued state gets picked up by **processor** from store. State gets passed to sequence of tasks that make up a job. When all tasks succeed job is marked as completed or if one task fails job is marked as failed. All updates are reflected in state and saved to store. Jobs and task can be managed (edited and resent in the future) via [`frontful-queue-monitor`](https://github.com/frontful/frontful-queue-monitor) or exposed [API](https://github.com/frontful/frontful-queue#api).
  - **Tasks** - Task is an endpoint that represents some external business logic that accepts JSON message via HTTP POST request. Sequence of tasks makes up a job. Task message builder receives **state** to construct outgoing message. Simplest outgoing message can be constructed like `message: state => state.message`, original message that job received will be set as outgoing message for task. Constructing outgoing messages from state means that it is integral for subsequent tasks to access responses from previous tasks e.g. `message: state => ({id: state.get('tasks.0.response.id')})`.
  - **State** - State is JSON object that contains all information about particular job instance, its tasks and incoming and outgoing messages. State is used to construct outgoing task messages, accessing responses and state as well as creating integrations with `frontful-queue` via its API.
  - **Processor** - Processor is responsible for job and task execution, sequence, polling as well as terminating tasks that may have potentially timed out.
  - **Triggers** - Trigger is specific endpoint that is called based on specified time interval. This can be useful to regularly trigger some endpoint, that in turn may result in POST messages to some job endpoints in `frontful-queue`.
  - **Store** - Store is message queue persistence layer, storage can be MSSQL, MySQL, Postgres, SQLite or memory. Storage abstraction is provided by [Sequelize](http://docs.sequelizejs.com/).

### Configuration

### State

### API

### Development

### Deployment
