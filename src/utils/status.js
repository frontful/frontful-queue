import fs from 'fs-extra'
import path from 'path'

function getFile() {
  const file = path.resolve(process.cwd(), '.status')
  fs.ensureFileSync(file)
  return file
}

export function setStatus(status) {
  const file = getFile()
  fs.writeFileSync(file, status)
}

export function getStatus() {
  const file = getFile()
  let status = fs.readFileSync(file, 'utf8').trim()
  if (!status) {
    setStatus('started')
    return getStatus()
  }
  return status
}
