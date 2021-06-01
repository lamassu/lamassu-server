import * as sanctuary from 'sanctuary'

const checkOnlyDev = () => {
  if (process.env.NODE_ENV !== 'production') return false

  return (
    process.env.NODE_ENV === 'development' &&
    process.env.REACT_APP_TYPE_CHECK_SANCTUARY === 'true'
  )
}

const S = sanctuary.create({
  checkTypes: checkOnlyDev(),
  env: sanctuary.env
})

export default S
