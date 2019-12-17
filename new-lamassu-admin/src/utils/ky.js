import ky from 'ky'

const api = ky.create({
  prefixUrl:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8070/api/'
      : '/api',
})

export default api
