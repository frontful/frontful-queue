import nodemailer from 'nodemailer'
import config from 'frontful-config/server'
import {store} from '../models/store'
import Job from '../models/Job'
import {parser} from './parser'

let transporter
if (config.email) {
  transporter = nodemailer.createTransport(config.email.options)
}

export function email(id) {
  if (config.email) {
    return store.getById(id).then(model => new Job(model)).then(job => {
      return transporter.sendMail(Object.assign(config.email.message(job.state), {
        attachments: [
          {
            filename: 'Message.xml',
            content: parser.messageToXml(job.state.message, job.state),
          },
          {
            filename: 'Message.json',
            content: parser.messageToJson(job.state.message, job.state),
          },
          {
            filename: 'State.json',
            content: JSON.stringify(job.state, null, 2),
          },
        ],
      }))
    })
  }
  else {
    return Promise.resolve()
  }
}
