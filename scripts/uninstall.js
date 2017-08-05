const Service = require('node-windows').Service // eslint-disable-line
const path = require('path')

const svc = new Service({
  name: 'Frontful Queue',
  script: path.resolve(process.cwd(), './build/server/index.js'),
})

svc.on('uninstall', () => {
  console.log(`Service ${svc.exists ? 'is not' : 'is'} uninstalled`)
})

svc.uninstall()
