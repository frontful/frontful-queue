/* eslint-disable new-cap */

import Sequelize from 'sequelize'
import log from '../../utils/log'
import serverConfig from 'frontful-config/server'

function createConnection() {
  const connection = new Sequelize({
    logging: process.env.NODE_ENV !== 'production',
    ...serverConfig.store.connection,
  })

  connection.define(serverConfig.store.table, {
    id: {type: Sequelize.UUID, primaryKey: true, allowNull: false},
    name: {type: Sequelize.STRING},
    origin: {type: Sequelize.ENUM('external', 'internal')},
    status: {type: Sequelize.ENUM('queued', 'processing', 'success', 'error', 'waiting')},
    status_details: {type: Sequelize.TEXT},
    created: {type: Sequelize.BIGINT},
    modified: {type: Sequelize.BIGINT},
    state: {type: Sequelize.TEXT},
    tag01: {type: Sequelize.STRING},
    tag02: {type: Sequelize.STRING},
    tag03: {type: Sequelize.STRING},
    tag04: {type: Sequelize.STRING},
    tag05: {type: Sequelize.STRING},
    tag06: {type: Sequelize.STRING},
    tag07: {type: Sequelize.STRING},
  }, {
    timestamps: false,
    tableName: serverConfig.store.table,
    indexes: [
      {fields: [{attribute: 'created', order: 'DESC'}, 'status']},
      {fields: ['tag01']},
      {fields: ['tag02']},
      {fields: ['tag03']},
      {fields: ['tag04']},
      {fields: ['tag05']},
      {fields: ['tag06']},
      {fields: ['tag07']},
    ]
  })

  connection.sync().catch(log.error)

  return connection
}

let storeConnection = createConnection()

if (process.frontful_ensureStoreConnection) {
  if (process.frontful_ensureStoreConnection.timeout) {
    clearTimeout(process.frontful_ensureStoreConnection.timeout)
  }
  process.frontful_ensureStoreConnection.start = () => {}
}

process.frontful_ensureStoreConnection = {
  start() {
    this.timeout = setTimeout(() => {
      storeConnection.authenticate().then(() => {
        this.start()
      }).catch((error) => {
        log.error(error)
        storeConnection.close()
        storeConnection = createConnection()
        this.start()
      })
    }, 1000 * 60 * 1)
  }
}

process.frontful_ensureStoreConnection.start()

const connection = () => {
  return storeConnection
}

export {
  connection,
}
