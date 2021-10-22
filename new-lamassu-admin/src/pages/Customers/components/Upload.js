import { makeStyles } from '@material-ui/core/styles'
import { useFormikContext } from 'formik'
import * as R from 'ramda'
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { Label3, H3 } from 'src/components/typography'
import { ReactComponent as UploadPhotoIcon } from 'src/styling/icons/button/photo/zodiac-resized.svg'
import { ReactComponent as UploadFileIcon } from 'src/styling/icons/button/upload-file/zodiac-resized.svg'
import { offColor, subheaderColor } from 'src/styling/variables'

const useStyles = makeStyles({
  box: {
    boxSizing: 'border-box',
    marginTop: 40,
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
  inputContent: {
    marginTop: 35,
    display: 'flex'
  },
  uploadContent: {
    marginTop: 50,
    display: 'flex'
  },
  board: {
    width: 450,
    height: 120
  },
  icon: {
    margin: [[14, 20, 0, 0]]
  }
})

const Upload = ({ type }) => {
  const classes = useStyles()

  const [data, setData] = useState({})

  const { setFieldValue } = useFormikContext()

  const IMAGE = 'image'
  const isImage = type === IMAGE

  const onDrop = useCallback(
    acceptedData => {
      // TODO: attach the uploaded data to the form as well
      setFieldValue(type, R.head(acceptedData).name)

      setData({
        preview: isImage
          ? URL.createObjectURL(R.head(acceptedData))
          : R.head(acceptedData).name
      })
    },
    [isImage, type, setFieldValue]
  )

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  return (
    <>
      <div {...getRootProps()} className={classes.board}>
        {R.isEmpty(data) && (
          <div className={classes.box}>
            <input {...getInputProps()} />
            <div className={classes.inputContent}>
              {isImage ? (
                <UploadPhotoIcon className={classes.icon}></UploadPhotoIcon>
              ) : (
                <UploadFileIcon className={classes.icon}></UploadFileIcon>
              )}
              <Label3>{`Drag and drop ${
                isImage ? 'an image' : 'a file'
              } or click to open the explorer`}</Label3>
            </div>
          </div>
        )}
        {!R.isEmpty(data) && type === IMAGE && (
          <div key={data.name}>
            <img src={data.preview} className={classes.box} alt=""></img>
          </div>
        )}
        {!R.isEmpty(data) && type !== IMAGE && (
          <div className={classes.box}>
            <H3 className={classes.uploadContent}>{data.preview}</H3>
          </div>
        )}
      </div>
    </>
  )
}

export default Upload
