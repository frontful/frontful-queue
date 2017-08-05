require('frontful-model').reset()

const winston = require('winston')
winston.configure({
  transports: [
    new winston.transports.File({filename: 'application.log'}),
  ]
})
winston.info('Application started')

require('./trigger')
require('../models/processor').start()

export default require('./mounts')
