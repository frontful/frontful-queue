const Service = require('node-windows').Service // eslint-disable-line
const path = require('path')

const svc = new Service({
  name: 'Frontful Queue',
  script: path.resolve(process.cwd(), './build/server/index.js'),
  description: 'Message queue microservice',
  cwd: process.cwd(),
  wait: 5,
  grow: .5,
  maxRetries: 20,
  env: [
    {
      name: 'NODE_ENV',
      value: 'production',
    },
    {
      name: 'PORT',
      value: process.env.PORT || 7010,
    },
  ],
})

svc.on('install', () => {
  console.log(`Service ${svc.exists ? 'is' : 'is not'} installed`)
  svc.start()
})

svc.install()
