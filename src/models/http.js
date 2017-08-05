import {Models} from 'frontful-model'
import {dao} from 'frontful-dao'

const models = new Models({})

@dao(() => ({
  url: ''
}))
class Http {}

const http = models.global(Http)

export {
  http,
}
