import Job from '../../models/Job'
import bodyParser from 'body-parser'
import express from 'express'
import serverConfig from 'frontful-config/server'

const app = express()

app.use(bodyParser.json())

serverConfig.jobs.forEach((job) => {
  app.post(job.path, (req, res, next) => {
    new Job(job.name, req.body).save().then((job) => {
      res.json(job.state)
    }).catch(next)
  })
})

export default app
