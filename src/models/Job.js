/* eslint-disable new-cap */

import Sequelize from 'sequelize'
import environment from 'frontful-environment'
import objectPath from 'object-path'
import serverConfig from 'frontful-config/server'
import {http} from './http'
import {store} from './store'
import {HttpError} from 'frontful-dao'

export default class Job {
  constructor(...args) {
    if (typeof args[0] === 'object') {
      this.restore(args[0])
    }
    else {
      this.create(args[0], args[1])
    }
    this.state.get = (path) => {
      return objectPath.get(this.state, path)
    }
  }

  process() {
    const task = this.state.tasks.find((task) => task.status === 'queued')
    if (task) {
      const setup = this.setup.tasks.find((setup) => setup.name === task.name)
      const modified = Date.now()
      Object.assign(this.state, {
        status: 'processing',
        modified: modified,
      })
      Object.assign(task, {
        message: setup.message(this.state),
        status: 'processing',
        modified: modified,
      })
      return this.save().then(() => {
        return http.post(setup.url, task.message).then((response) => {
          Object.assign(task, {
            status: 'success',
            modified: Date.now(),
            response: response,
          })
          return this.save().then(() => {
            return this.process()
          })
        })
      }).catch((error) => {
        const modified = Date.now()
        let errorMessage = environment.error.parser(error).string
        if (error instanceof HttpError && error.parsed && error.parsed.error && error.parsed.error.what) {
          errorMessage = `HttpError ${error.response.status}; ${error.parsed.error.what}; ${error.parsed.error.where}`
        }
        Object.assign(this.state, {
          status: 'error',
          modified: modified,
          status_details: errorMessage,
        })
        Object.assign(task, {
          status: 'error',
          modified: modified,
          response: errorMessage,
        })
        return this.save().then(() => {
          throw error
        })
      })
    }
    else {
      Object.assign(this.state, {
        status: 'success',
        modified: Date.now(),
      })
      return this.save()
    }
  }

  validate() {
    if (this.state.status === 'processing') {
      const now = Date.now()
      const lastUpdated = this.state.modified || this.state.created || 0
      if ((now - lastUpdated) > serverConfig.processor.timeout) {
        const errorMessage = 'Timed out'
        Object.assign(this.state, {
          status: 'error',
          status_details: errorMessage,
          modified: now,
        })
        const task = this.state.tasks.find((task) => task.status === 'processing')
        if (task) {
          Object.assign(task, {
            status: 'error',
            modified: now,
            response: errorMessage,
          })
        }
        return this.save()
      }
    }
  }

  fields() {
    const tags = (this.setup.tags ? this.setup.tags(this.state) : []).reduce((tags, tag, idx) => {
      tags[`tag0${idx + 1}`] = tag
      return tags
    }, {})

    return {
      ...tags,
      id: this.state.id,
      name: this.state.name,
      origin: this.state.origin,
      status: this.state.status,
      status_details: this.state.status_details,
      created: this.state.created,
      modified: this.state.modified,
      state: JSON.stringify(this.state)
    }
  }

  restore(model) {
    this.model = model
    this.state = JSON.parse(model.state)
    this.setup = serverConfig.jobs.find((job) => job.name === this.state.name)
  }

  create(name, message) {
    this.model = null
    this.setup = serverConfig.jobs.find((job) => job.name === name)
    this.state = {
      id: Sequelize.Utils.toDefaultValue(Sequelize.UUIDV4()),
      name: name,
      message: message,
      origin: 'external',
      status: 'queued',
      status_details: '',
      created: Date.now(),
      modified: null,
      tasks: this.setup.tasks.map((task) => ({
        name: task.name,
        message: null,
        response: null,
        modified: null,
        status: 'queued',
      })),
    }
  }

  save() {
    if (this.model) {
      return this.model.update(this.fields()).then((model) => {
        this.model = model
        return this
      })
    }
    else {
      return store.create(this.fields()).then((model) => {
        this.model = model
        return this
      })
    }
  }
}
