const url =
  process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : ''

const urlResolver = content => `${url}${content}`

export { urlResolver }
