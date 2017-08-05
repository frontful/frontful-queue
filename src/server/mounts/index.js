import api from './api'
import cors from 'cors'
import environment from 'frontful-environment'
import express from 'express'
import jobs from './jobs'
import log from './log'
import sample from './sample'

const app = express()

app.use(cors())
app.use(jobs)
app.use('/log', log)
app.use('/api', api)
app.use('/sample', sample)
app.use(environment.error.getHandler())

export default app
