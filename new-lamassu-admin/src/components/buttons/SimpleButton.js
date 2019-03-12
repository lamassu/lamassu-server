import React, { memo } from 'react'
import classnames from 'classnames'

const SimpleButton = memo(({ className, children, color, size, ...props }) => {
  return (
    <button className={classnames('simple-button', className)} {...props}>
      {children}
    </button>
  )
})

export default SimpleButton
