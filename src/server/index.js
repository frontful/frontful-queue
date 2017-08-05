require('frontful-model').reset()

const serverConfig = require('frontful-config/server')
const winston = require('winston')

winston.configure({
  transports: [
    new winston.transports.File({
      filename: 'application.log'
    }),
  ]
})
winston.info('Application started')

if (serverConfig.active) {
  require('./trigger')
  require('../models/processor').start()
}

export default require('./mounts')
