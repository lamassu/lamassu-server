import React from 'react'

import { ReactComponent as FalseIcon } from 'src/styling/icons/table/false.svg'
import { ReactComponent as TrueIcon } from 'src/styling/icons/table/true.svg'

const BooleanCell = ({ value }) => (value ? <TrueIcon /> : <FalseIcon />)

export default BooleanCell
