import * as R from 'ramda'
import React, { useState, memo } from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import {
  mainFields,
  overrides,
  getSchema,
  getOverridesSchema,
  defaults,
  overridesDefaults,
  getOrder
} from 'src/pages/Commissions/helper'

const CommissionsDetails = memo(
  ({ config, locale, currency, data, error, save, saveOverrides, classes }) => {
    const [isEditingDefault, setEditingDefault] = useState(false)
    const [isEditingOverrides, setEditingOverrides] = useState(false)

    const commission = config && !R.isEmpty(config) ? config : defaults
    const commissionOverrides = commission?.overrides ?? []

    const orderedCommissionsOverrides = R.sortWith([
      R.ascend(getOrder),
      R.ascend(R.prop('machine'))
    ])(commissionOverrides)

    const onEditingDefault = (it, editing) => setEditingDefault(editing)
    const onEditingOverrides = (it, editing) => setEditingOverrides(editing)

    return (
      <>
        <Section>
          <EditableTable
            error={error?.message}
            title="Default setup"
            rowSize="lg"
            titleLg
            name="commissions"
            enableEdit
            initialValues={commission}
            save={save}
            validationSchema={getSchema(locale)}
            data={R.of(commission)}
            elements={mainFields(currency)}
            setEditing={onEditingDefault}
            forceDisable={isEditingOverrides}
          />
        </Section>
        <Section>
          <EditableTable
            error={error?.message}
            title="Overrides"
            titleLg
            name="overrides"
            enableDelete
            enableEdit
            enableCreate
            groupBy={getOrder}
            initialValues={overridesDefaults}
            save={saveOverrides}
            validationSchema={getOverridesSchema(
              orderedCommissionsOverrides,
              data,
              locale
            )}
            data={orderedCommissionsOverrides}
            elements={overrides(data, currency, orderedCommissionsOverrides)}
            setEditing={onEditingOverrides}
            forceDisable={isEditingDefault}
          />
        </Section>
      </>
    )
  }
)

export default CommissionsDetails
