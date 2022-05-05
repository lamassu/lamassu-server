import React, { memo } from 'react'

const TableHead = memo(({ children, ...props }) => (
  <thead {...props}>{children}</thead>
))

export default TableHead
