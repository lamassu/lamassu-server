import { disabledColor, secondaryColor } from 'src/styling/variables'

const mainStyles = {
  columnWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%'
  },
  bottomRightAligned: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
    marginTop: 'auto'
  },
  modalHeader: {
    display: 'flex',
    marginBottom: 14
  },
  modalBody: {
    display: 'flex',
    height: '100%'
  },
  wizardStepsWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    flex: 'wrap',
    marginBottom: 10
  },
  unreachedStepLine: {
    width: 24,
    height: 2,
    border: `solid 1px ${disabledColor}`
  },
  reachedStepLine: {
    width: 24,
    height: 2,
    border: `solid 1px ${secondaryColor}`
  }
}

export { mainStyles }
