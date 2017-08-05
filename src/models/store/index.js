import serverConfig from 'frontful-config/server'
import {connection} from './connection'

function model() {
  return connection().model(serverConfig.store.table)
}

const store = {
  create(fields) {
    return model().create(fields)
  },
  getProcessing() {
    return model().findOne({
      attributes: ['id', 'state'],
      where: {status: 'processing'},
      order: [['created', 'ASC']],
    })
  },
  getQueued() {
    return model().findOne({
      attributes: ['id', 'state'],
      where: {status: 'queued'},
      order: [['created', 'ASC']],
    })
  },
  get(count, page, search) {
    count = count || 100
    page = page || 1
    search = search || ''

    let where = {}

    if (search) {
      where = {
        where: {
          state: {
            $like: '%' + search.trim().replace(/\s+/gi, '%') + '%'
          }
        }
      }
    }

    return model().findAll({
      offset: count * (page - 1),
      limit: count,
      ...where,
      attributes: ['id', 'state'],
      order: [['created', 'DESC']],
    })
  },
}

export {
  store,
}
