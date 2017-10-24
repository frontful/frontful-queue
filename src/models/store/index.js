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
      where: {
        status: 'processing'
      },
      order: [['created', 'ASC']],
    })
  },
  getQueued() {
    return model().findOne({
      attributes: ['id', 'state'],
      where: {
        $or: [
          {status: 'queued'},
          {status: 'waiting'},
        ],
      },
      order: [['created', 'ASC']],
    })
  },
  getById(id) {
    return model().findOne({
      attributes: ['id', 'state'],
      where: {
        id: id,
      },
    })
  },
  find(where) {
    return model().findOne({
      attributes: ['id', 'state'],
      where: where,
    })
  },
  search(page, count, search, where) {
    page = page || 1
    count = count || 20
    search = search || ''
    return model().findAll(Object.assign({
      offset: count * (page - 1),
      limit: count,
      attributes: ['id', 'state'],
      order: [['created', 'DESC']],
    }, (search || where) ? {
      where: Object.assign({}, search ? {
        state: {
          $like: '%' + search.trim().replace(/\s+/gi, '%') + '%'
        }
      } : {}, where)
    } : {}))
  },
}

export {
  store,
}
