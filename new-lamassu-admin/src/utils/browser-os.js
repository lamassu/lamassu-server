const parser = require('ua-parser-js')

function getRequestIP(req) {
  return req.ip
}

function getInformation(uaString) {
  const userAgent = parser(uaString)
  const browser = `${userAgent.browser.name} ${userAgent.browser.version}`
  const OS = `${userAgent.os.name} ${userAgent.os.version}`
  return { browser: browser, OS: OS }
}

module.exports = { getRequestIP, getInformation }
