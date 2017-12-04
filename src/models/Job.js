/* eslint-disable new-cap */

import Sequelize from 'sequelize'
import environment from 'frontful-environment'
import objectPath from 'object-path'
import serverConfig from 'frontful-config/server'
import {HttpError} from 'frontful-dao'
import {LogicalError, WaitError} from './Errors'
import {http} from './http'
import {socket} from './socket'
import {store} from './store'

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

  static load(id) {
    return store.getById(id).then((model) => {
      return model ? new Job(model) : null
    })
  }

  process() {
    try {
      const task = this.state.tasks.find((task) => task.status === 'queued' || task.status === 'waiting')
      const taskIndex = this.state.tasks.indexOf(task)

      if (this.state.wait && (this.state.modified || this.state.created) + this.state.wait > Date.now()) {
        return Promise.reject(new WaitError())
      }

      if (task) {
        const tasksSetup = Array.isArray(this.setup.tasks) ? this.setup.tasks : this.setup.tasks(this.state)
        const setup = tasksSetup[taskIndex]
        const modified = Date.now()
        Object.assign(this.state, {
          status: 'processing',
          modified: modified,
          wait: null,
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
            if (setup.status) {
              const status = setup.status(response)
              if (!status.success) {
                if (status.wait) {
                  Object.assign(this.state, {
                    status: 'waiting',
                    modified: Date.now(),
                    wait: status.wait,
                  })
                  Object.assign(task, {
                    status: 'waiting',
                  })
                  if (status.count) {
                    if (this.state.count >= status.count) {
                      throw new LogicalError(response)
                    }
                    Object.assign(this.state, {
                      count: (this.state.count || 0) + 1,
                    })
                  }
                }
                else {
                  throw new LogicalError(response)
                }
              }
              else {
                if (status.warning) {
                  Object.assign(task, {
                    status: 'warning',
                  })
                  Object.assign(this.state, {
                    status_details: status.warning,
                  })
                }
              }
            }
            if (task.status === 'success') {
              Object.assign(this.state, {
                count: null,
              })
            }
            return this.save().then(() => {
              if (this.state.status !== 'waiting') {
                return this.process()
              }
            })
          })
        }).catch((error) => {
          if (error instanceof WaitError || this.state.status === 'error') {
            throw error
          }
          else {
            const modified = Date.now()
            let errorMessage = environment.error.parser(error).string
            let response = errorMessage
            if (error instanceof LogicalError) {
              errorMessage = `${error.message}`
              response = error.response
            } else if (error instanceof HttpError && error.parsed && error.parsed.error && error.parsed.error.what) {
              errorMessage = error.parsed.error.what
              response = error.parsed
            }
            Object.assign(this.state, {
              status: 'error',
              modified: modified,
              status_details: errorMessage,
            })
            Object.assign(task, {
              status: 'error',
              modified: modified,
              response: response,
            })
            return this.save().then(() => {
              throw error
            })
          }
        })
      }
      else {
        Object.assign(this.state, {
          status: !this.state.status_details ? 'success' : 'warning',
          modified: Date.now(),
        })
        return this.save()
      }
    }
    catch(error) {
      Object.assign(this.state, {
        status: 'error',
        modified: Date.now(),
        status_details: error.toString(),
      })
      return this.save().then(() => {
        throw error
      })
    }
  }

  validate() {
    if (this.state.status === 'processing') {
      const now = Date.now()
      const lastUpdated = this.state.modified || this.state.created || 0
      if ((now - lastUpdated) > serverConfig.processor.processingTimeout) {
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
    const now = Date.now()
    this.state = {
      id: Sequelize.Utils.toDefaultValue(Sequelize.UUIDV4()),
      name: name,
      message: message,
      origin: 'external',
      status: 'queued',
      status_details: '',
      created: now,
      modified: now,
      wait: null,
      count: null,
    }
    const tasksSetup = Array.isArray(this.setup.tasks) ? this.setup.tasks : this.setup.tasks(this.state)
    this.state.tasks = tasksSetup.map((task) => ({
      name: task.name,
      message: null,
      response: null,
      modified: null,
      status: 'queued',
    }))
  }

  reset(message) {
    const now = Date.now()
    Object.assign(this.state, {
      message_original: this.state.message_original || this.state.message,
      message: message,
      origin: 'internal',
      status: 'queued',
      status_details: '',
      modified: now,
      wait: null,
      count: null,
    })
    const tasksSetup = Array.isArray(this.setup.tasks) ? this.setup.tasks : this.setup.tasks(this.state)
    this.state.tasks = tasksSetup.map((task) => ({
      name: task.name,
      message: null,
      response: null,
      modified: null,
      status: 'queued',
    }))
    return this
  }

  retry() {
    if (this.state.status === 'error') {
      const now = Date.now()
      Object.assign(this.state, {
        status: 'queued',
        status_details: '',
        modified: now,
        wait: null,
        count: null,
      })
      this.state.tasks = this.state.tasks.map((task) => {
        if (task.status === 'error') {
          return {
            name: task.name,
            message: null,
            response: null,
            modified: null,
            status: 'queued',
          }
        }
        else {
          return task
        }
      })
    }
    return this
  }

  save() {
    if (this.model) {
      return this.model.update(this.fields()).then((model) => {
        this.model = model
        socket.updated(this.state.id)
        return this
      })
    }
    else {
      return store.create(this.fields()).then((model) => {
        this.model = model
        socket.added(this.state.id)
        return this
      })
    }
  }
}
