import React from 'react'

function Radio ({ label, ...props }) {
  return (
    <>
      <label>
        <input type='radio' className='with-gap' name='gruop1' />
        <span>{label || ''}</span>
      </label>
    </>
  )
}

export default Radio
