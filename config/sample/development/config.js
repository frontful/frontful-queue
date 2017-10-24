const url = {
  logicUrl: 'http://localhost:7010',
}

module.exports = {
  browser: {},
  common: {},
  server: {
    store: require('./store'),
    token: 'c2FtcGxl',
    email: false,
    parser: false,
    trigger: {
      [`${url.logicUrl}/sample/trigger`]: 1000 * 10,
    },
    processor: {
      pollingInterval: 1000 * 10,
      processingTimeout: 1000 * 60 * 1,
    },
    jobs: [
      require('../common/jobs/sample_job_foobar')(url),
    ],
  },
}
