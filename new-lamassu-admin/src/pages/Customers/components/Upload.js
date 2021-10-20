import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { Info3 } from 'src/components/typography'
import { offColor, subheaderColor } from 'src/styling/variables'

const useStyles = makeStyles({
  box: {
    boxSizing: 'border-box',
    marginTop: 31,
    width: 450,
    height: 120,
    borderStyle: 'dashed',
    borderColor: offColor,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: subheaderColor,
    display: 'flex',
    justifyContent: 'center'
  },
  boxContent: {
    marginTop: 30
  },
  board: {
    width: 450,
    height: 120
  }
})

const Upload = ({ type }) => {
  const classes = useStyles()
  const IMAGE = 'image'

  const [data, setData] = useState({})

  const message =
    type === IMAGE
      ? 'Drag and drop an image or click to select a file'
      : 'Drag and drop or click to select a file'

  const onDrop = useCallback(acceptedData => {
    setData({ preview: URL.createObjectURL(R.head(acceptedData)) })
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  return (
    <>
      <div {...getRootProps()} className={classes.board}>
        <input {...getInputProps()} />
        {R.isEmpty(data) && (
          <div className={classes.box}>
            <div className={classes.boxContent}>
              <Info3>{message}</Info3>
            </div>
          </div>
        )}
        {!R.isEmpty(data) && type === IMAGE && (
          <div key={data.name}>
            <img src={data.preview} className={classes.box}></img>
          </div>
        )}
      </div>
    </>
  )
}

export default Upload
