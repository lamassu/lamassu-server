const url = `https://${window.location.hostname}`

const urlResolver = content => `${url}${content}`

export { urlResolver }
