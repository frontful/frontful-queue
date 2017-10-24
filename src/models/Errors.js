import ExtendableError from 'es6-error'

export class LogicalError extends ExtendableError {
  constructor(response) {
    const message = response && response.status && response.status[0] && (response.status[0].description + '\r\n' + response.status[0].source)
    super(message)
    this.response = response
  }
}

export class WaitError extends ExtendableError {
}
