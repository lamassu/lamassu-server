import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { useState, memo } from 'react'

import { Link, IconButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { Table, TableBody, TableRow, TableCell } from 'src/components/table'
import BooleanCell from 'src/components/tables/BooleanCell'
import { H4, P } from 'src/components/typography'
import { ReactComponent as EditIconDisabled } from 'src/styling/icons/action/edit/disabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import Tooltip from '../Tooltip'

import { booleanPropertiesTableStyles } from './BooleanPropertiesTable.styles'

const useStyles = makeStyles(booleanPropertiesTableStyles)

const BooleanPropertiesTable = memo(
  ({ title, disabled, data, elements, save }) => {
    const [editing, setEditing] = useState(false)
    const [radioGroupValues, setRadioGroupValues] = useState(elements)

    const classes = useStyles()

    const innerSave = () => {
      radioGroupValues.forEach(element => {
        data[element.name] = element.value
      })

      save(data)
      setEditing(false)
    }

    const innerCancel = () => {
      setRadioGroupValues(elements)
      setEditing(false)
    }

    const handleRadioButtons = (elementName, newValue) => {
      setRadioGroupValues(
        radioGroupValues.map(element =>
          element.name === elementName
            ? { ...element, value: newValue }
            : element
        )
      )
    }

    const radioButtonOptions = [
      { display: 'Yes', code: true },
      { display: 'No', code: false }
    ]

    if (!elements || radioGroupValues?.length === 0) return null

    return (
      <div className={classes.booleanPropertiesTableWrapper}>
        <div className={classes.rowWrapper}>
          <H4>{title}</H4>
          {editing ? (
            <div className={classes.rightAligned}>
              <Link onClick={innerCancel} color="secondary">
                Cancel
              </Link>
              <Link
                className={classes.rightLink}
                onClick={innerSave}
                color="primary">
                Save
              </Link>
            </div>
          ) : (
            <>
              {disabled && (
                <IconButton disabled>
                  <EditIconDisabled />
                </IconButton>
              )}

              {!disabled && (
                <Tooltip
                  enableOver
                  element={
                    <IconButton onClick={() => setEditing(true)}>
                      <EditIcon />
                    </IconButton>
                  }>
                  <P>Configure the following properties as desired</P>
                </Tooltip>
              )}
            </>
          )}
        </div>
        <Table className={classes.fillColumn}>
          <TableBody className={classes.fillColumn}>
            {radioGroupValues &&
              radioGroupValues.map((element, idx) => (
                <TableRow key={idx} size="sm" className={classes.tableRow}>
                  <TableCell className={classes.leftTableCell}>
                    {element.display}
                  </TableCell>
                  <TableCell className={classes.rightTableCell}>
                    {editing && (
                      <RadioGroup
                        options={radioButtonOptions}
                        value={element.value}
                        onChange={event =>
                          handleRadioButtons(
                            element.name,
                            event.target.value === 'true'
                          )
                        }
                        className={classnames(
                          classes.radioButtons,
                          classes.rightTableCell
                        )}
                      />
                    )}
                    {!editing && (
                      <BooleanCell
                        className={classes.rightTableCell}
                        value={element.value}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    )
  }
)

export default BooleanPropertiesTable
