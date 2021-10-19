import { makeStyles } from '@material-ui/core/styles'
import { useFormikContext } from 'formik'

const useStyles = makeStyles({
  input: {
    width: 200
  }
})

const Upload = ({ type }) => {
  const classes = useStyles()
  const { values } = useFormikContext()
  console.log(values)

  return (
    <>
      <div className={classes.board}>
        <input
          type={type}
          name={type}
          onClick={() => {
            console.log(values)
          }}
          className={classes.input}
        />
      </div>
      <div className={classes.picture}></div>
    </>
  )
}

export default Upload
