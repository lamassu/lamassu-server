import rootAxios from 'axios'

const axios = rootAxios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '//localhost:8070' : ''
})

function getMachines (opts) {
  return axios('/api/machines', opts)
}

function getFunding (opts) {
  return axios('/api/funding', opts)
}

function getLogByMachineId (machineId, opts) {
  return axios(`/api/logs/${machineId}`, opts)
}

export { getMachines, getFunding, getLogByMachineId }
