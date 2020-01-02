import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import useAxios from '@use-hooks/axios'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

const AuthRegister = () => {
  const history = useHistory()
  const query = useQuery()

  useAxios({
    url: `https://localhost:8070/api/register?otp=${query.get('otp')}`,
    method: 'GET',
    options: {
      withCredentials: true
    },
    trigger: [],
    customHandler: (err, res) => {
      if (err) return
      if (res) {
        history.push('/')
      }
    }
  })

  return <span>registering...</span>
}

export default AuthRegister
