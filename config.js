module.exports = {
  browser: {},
  common: {},
  server: {
    store: {
      connection: {
        dialect: 'sqlite',
        storage: './db.sqlite'
      },
      table: 'queue',
    },
    trigger: {
      'http://localhost:7010/sample/trigger': 1000 * 30,
    },
    processor: {
      interval: 1000 * 15,
      timeout: 1000 * 60 * 3,
    },
    jobs: [
      {
        name: 'sample_job_foobar',
        path: '/sample/job/foobar',
        tasks: [
          {
            name: 'sample_task_foo',
            url: 'http://localhost:7010/sample/logic/foo',
            message: state => state.message,
          },
          {
            name: 'sample_task_bar',
            url: 'http://localhost:7010/sample/logic/bar',
            message: state => Object.assign({
              id_foo: state.get('tasks.0.response.id_foo'),
            }, state.message),
          },
        ],
        tags: state => ({
          tag01: state.get('message.id_foobar'),
          tag02: state.get('tasks.0.response.id_foo'),
          tag03: state.get('tasks.0.response.id_bar'),
        }),
      },
    ],
  },
}
