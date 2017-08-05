import environment from 'frontful-environment'
import winston from 'winston'

function log(message) {
  try {
    winston.debug(message)
  }
  catch(error) {
    console.log(error)
  }
}

log.error = function(e) {
  try {
    const error = environment.error.parser(e)
    winston.error(error.string)
    console.log(error.colorful || error.string)
  }
  catch(error) {
    console.log(error)
  }
}

export default log
