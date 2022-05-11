import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'
import * as serviceWorker from './serviceWorker'

function checkBuildTarget() {
  const buildTarget = process.env.REACT_APP_BUILD_TARGET

  if (buildTarget !== 'LAMASSU' && buildTarget !== 'PAZUZ') {
    return Promise.reject(
      new Error('No such build target: ' + process.env.REACT_APP_BUILD_TARGET)
    )
  }

  return Promise.resolve()
}

checkBuildTarget().then(() =>
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  )
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
