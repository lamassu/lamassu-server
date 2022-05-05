import * as R from 'ramda'
import React from 'react'

import { fromNamespace, toNamespace } from 'src/utils/config'

import EditableTable from './Table'

const NamespacedTable = ({
  name,
  save,
  data = {},
  namespaces = [],
  ...props
}) => {
  const innerSave = (...[, it]) => {
    return save(toNamespace(it.id)(R.omit(['id2'], it)))
  }

  const innerData = R.map(it => ({
    id: it,
    ...fromNamespace(it)(data)
  }))(namespaces)

  return (
    <EditableTable name={name} data={innerData} save={innerSave} {...props} />
  )
}

export default NamespacedTable
