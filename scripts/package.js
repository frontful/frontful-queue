const fs = require('fs')
const archiver = require('archiver')
const resolve = require('path').resolve

const name = 'frontful-queue'
const folder = 'package'
const timestamp = new Date().toISOString().substr(0, 19).replace(/-|:/g, '')
const path = resolve(process.cwd(), folder)
const fileName = `${name}-${timestamp}.zip`
const filePath = resolve(path, fileName)

if (!fs.existsSync(path)) {
  fs.mkdirSync(path)
}

const archive = archiver('zip', {zlib: {level: 9}})

const output = fs.createWriteStream(filePath)

output.on('close', function() {
  console.log(`${Math.round(archive.pointer() * 10 / 1024) / 10.0}Kb ${fileName}`)
})

archive.pipe(output)
archive.glob(`**`, {
  ignore: [
    `node_modules/**`,
    `package/**`,
    `build/**`,
    `*.log`,
    `*.sqlite`,
  ]
})
archive.finalize()
