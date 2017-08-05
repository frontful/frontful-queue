import express from 'express'
import winston from 'winston'

const app = express()

app.get('/', (req, res, next) => {
  const count = (req.query ? parseInt(req.query.count, 10) : undefined) || 100
  const page = (req.query ? parseInt(req.query.page, 10) : undefined) || 1
  winston.query({
    limit: count,
    start: (page - 1) * count,
    order: 'desc',
  }, (error, logs) => (error ? next(error) : res.json(logs.file)))
})

export default app
