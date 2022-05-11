const url = `https://${
  process.env.NODE_ENV === 'development'
    ? window.location.host
    : window.location.hostname
}`

const urlResolver = content => `${url}${content}`

export { urlResolver }
