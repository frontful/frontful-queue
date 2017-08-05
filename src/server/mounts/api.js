import bodyParser from 'body-parser'
import express from 'express'
import {store} from '../../models/store'

const app = express()

app.use(bodyParser.json())

app.get('/jobs', (req, res, next) => {
  const count = req.query ? parseInt(req.query.count, 10) : undefined
  const page = req.query ? parseInt(req.query.page, 10) : undefined
  const search = req.query ? req.query.search : ''
  store.get(count, page, search).then((jobs) => {
    res.json(jobs.map((job) => JSON.parse(job.state)))
  }).catch(next)
})

export default app
