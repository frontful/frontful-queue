import api from './api'
import cors from 'cors'
import environment from 'frontful-environment'
import express from 'express'
import jobs from './jobs'
import log from './log'
import sample from './sample'
import {socket} from '../../models/socket'

const app = express()

app.use((req, res, next) => {
  const timeout = 60 * 60 * 1000
  if (environment.listener.timeout !== timeout) {
    console.log(`Server timeout set to ${timeout}ms`)
    environment.listener.timeout = timeout
    socket.initialize(environment.server)
  }
  next()
})

app.use(cors({
  origin: /.*/gi,
  credentials: true,
}))

app.use(jobs)
app.use('/log', log)
app.use('/api', api)
app.use('/sample', sample)
app.use(environment.error.getHandler())

export default app
