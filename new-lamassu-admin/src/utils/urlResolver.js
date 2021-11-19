const url =
  process.env.NODE_ENV === 'development'
    ? 'https://localhost:3001'
    : `https://${window.location.hostname}`

const urlResolver = content => `${url}${content}`

export { urlResolver }
