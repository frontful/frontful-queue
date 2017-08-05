import bodyParser from 'body-parser'
import express from 'express'
import {http} from '../../models/http'

const uid = () => Math.random().toString(36).substr(2, 10)
const app = express()

app.use(bodyParser.json())

app.get('/trigger', (req, res, next) => {
  http.post('http://localhost:7010/sample/job/foobar', {
    id_foobar: uid(),
    info: 'foobar'
  }).then(() => {
    res.json({})
  }).catch(next)
})

app.post('/logic/foo', (req, res, next) => {
  setTimeout(() => {
    try {
      res.json({
        id_foo: uid(),
        info: 'foo'
      })
    }
    catch(error) {
      next(error)
    }
  }, 100)
})

app.post('/logic/bar', (req, res, next) => {
  setTimeout(() => {
    try {
      res.json({
        id_bar: uid(),
        info: 'bar'
      })
    }
    catch(error) {
      next(error)
    }
  }, 100)
})

export default app
