import {Models} from 'frontful-model'
import {dao} from 'frontful-dao'

const models = new Models({})

@dao(() => ({
  url: '',
  timeout: 60 * 60 * 1000,
}))
class Http {}

const http = models.global(Http)

export {
  http,
}
