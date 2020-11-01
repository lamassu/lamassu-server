import React from 'react'

import { Td } from 'src/components/fake-table/Table'
import { ReactComponent as StripesSvg } from 'src/styling/icons/stripes.svg'

const Stripes = ({ width }) => (
  <Td width={width}>
    <StripesSvg />
  </Td>
)

export default Stripes
