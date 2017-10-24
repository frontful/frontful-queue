import Job from '../../models/Job'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import express from 'express'
import serverConfig from 'frontful-config/server'
import {cookies} from 'frontful-utils'
import {getStatus, setStatus} from '../../utils/status'
import {parser} from '../../utils/parser'
import {store} from '../../models/store'

function createPayloadJobItem(job) {
  if (job) {
    const state = JSON.parse(job.state)
    return {
      id: job.id,
      state: state,
      message: {
        xml: parser.messageToXml(state.message, state),
        json: parser.messageToJson(state.message, state),
      },
    }
  }
  else {
    return null
  }
}

const app = express()
app.use(bodyParser.json({
  strict: false,
}))

app.use(cookieParser())

app.use('/jobs', (req, res, next) => {
  const query = req.query || {}
  const page = parseInt(query.page, 10)
  const count = parseInt(query.count, 10)
  const search = query.search
  const where = req.body
  store.search(page, count, search, where).then((jobs) => {
    res.json(jobs.map(createPayloadJobItem))
  }).catch(next)
})

app.get('/job/:id', (req, res, next) => {
  store.getById(req.params.id).then((job) => {
    res.json(createPayloadJobItem(job))
  }).catch(next)
})

app.post('/find', (req, res, next) => {
  const where = req.body
  store.find(where).then((job) => {
    res.json(createPayloadJobItem(job))
  }).catch(next)
})

app.post('/job/:id/restart', (req, res, next) => {
  Job.load(req.params.id).then((job) => {
    const toMessage = typeof req.body === 'string' ? parser.xmlToMessage : parser.jsonToMessage
    return Promise.resolve(toMessage(req.body, job.state)).then((newMessage) => {
      return job.reset(newMessage).save().then((job) => {
        res.json(job.state.id)
      })
    })
  }).catch(next)
})

app.post('/job/:id/retry', (req, res, next) => {
  Job.load(req.params.id).then((job) => {
    return job.retry().save().then((job) => {
      res.json(job.state.id)
    })
  }).catch(next)
})

app.post('/signin', (req, res) => {
  const cookie = cookies(req)
  const token = req.body.token || cookie.get('token')
  cookie.set('token', token, {
    path: '/',
    expires: new Date(new Date().getTime() + 1000 * 60 * 30),
  })
  if (!serverConfig.token || serverConfig.token === token) {
    res.json({success: true})
  }
  else {
    res.status(403).end()
  }
})

app.post('/signout', (req, res) => {
  cookies(req).remove('token', {path: '/'})
  res.json({success: true})
})

app.get('/status', (req, res) => {
  res.json({
    status: getStatus(),
  })
})

app.post('/status/start', (req, res) => {
  setStatus('started')
  res.json({
    status: getStatus(),
  })
})

app.post('/status/stop', (req, res) => {
  setStatus('stopped')
  res.json({
    status: getStatus(),
  })
})

export default app
