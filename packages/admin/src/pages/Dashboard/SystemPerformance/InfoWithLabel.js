import React from 'react'

import { Info1, Label1 } from 'src/components/typography/index'
const InfoWithLabel = ({ info, label }) => {
  return (
    <>
      <Info1 style={{ marginBottom: 0 }}>{info}</Info1>
      <Label1 style={{ margin: 0 }}>{label}</Label1>
    </>
  )
}

export default InfoWithLabel
