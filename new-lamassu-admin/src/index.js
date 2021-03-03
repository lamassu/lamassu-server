import React from 'react'
import ReactDOM from 'react-dom'

import * as serviceWorker from './serviceWorker'

function importBuildTarget() {
  if (process.env.REACT_APP_BUILD_TARGET === 'LAMASSU') {
    return import('./App')
  } else if (process.env.REACT_APP_BUILD_TARGET === 'PAZUZ') {
    return import('./pazuz/App')
  } else {
    return Promise.reject(
      new Error('No such build target: ' + process.env.REACT_APP_BUILD_TARGET)
    )
  }
}

importBuildTarget().then(({ default: Environment }) =>
  ReactDOM.render(
    <React.StrictMode>
      <Environment />
    </React.StrictMode>,
    document.getElementById('root')
  )
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
