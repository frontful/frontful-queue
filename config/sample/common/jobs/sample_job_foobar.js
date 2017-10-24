module.exports = (url) => ({
  name: 'sample_job_foobar',
  path: '/sample/job/foobar',
  tasks: [
    {
      name: 'sample_task_foo',
      url: `${url.logicUrl}/sample/logic/foo`,
      message: state => state.message,
    },
    {
      name: 'sample_task_bar',
      url: `${url.logicUrl}/sample/logic/bar`,
      message: state => Object.assign({
        id_foo: state.get('tasks.0.response.id_foo'),
      }, state.message),
    },
  ],
  tags: state => [
    state.get('message.id_foobar'),
    state.get('tasks.0.response.id_foo'),
    state.get('tasks.0.response.id_bar'),
  ],
})
