import config from 'frontful-config/server'
const xml2js = require('xml2js')

export const parser = {
  messageToJson(message, state) {
    let json
    try {
      json = config.parser.messageToJson(message, state)
    }
    catch(error) {
      json = message
    }
    return JSON.stringify(json, null, 2)
  },
  messageToXml(message, state) {
    return new xml2js.Builder({
      explicitArray: false,
      attrkey: '$attribute',
      charkey: '$value',
      rootName: 'Root'
    }).buildObject(JSON.parse(parser.messageToJson(message, state)))
  },
  jsonToMessage(json, state) {
    try {
      return config.parser.jsonToMessage(json, state)
    }
    catch(error) {
      return json
    }
  },
  xmlToMessage(xml, state) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, {
        explicitArray: false,
        attrkey: '$attribute',
        charkey: '$value',
      }, (err, json) => {
        if (err) {
          reject(err)
        }
        else {
          resolve(parser.jsonToMessage(json['Root'], state))
        }
      })
    })
  },
}
