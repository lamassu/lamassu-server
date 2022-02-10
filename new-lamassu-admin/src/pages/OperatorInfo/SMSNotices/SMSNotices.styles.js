import {
  spacer,
  fontMonospaced,
  fontSize5,
  fontColor
} from 'src/styling/variables'

const styles = {
  header: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 800
  },
  form: {
    '& > *': {
      marginTop: 20
    },
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  submit: {
    margin: [['auto', 0, 0, 'auto']]
  },
  smsPreview: {
    position: 'absolute',
    left: ({ x }) => x,
    bottom: ({ y }) => y,
    width: 350,
    overflow: 'visible'
  },
  smsPreviewContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    '& > *': {
      marginRight: 10
    }
  },
  smsPreviewIcon: {
    display: 'flex',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16D6D3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  smsPreviewContent: {
    width: 225,
    padding: 15,
    borderRadius: '15px 15px 15px 0px'
  },
  chipButtons: {
    width: 480,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'space-between',
    '& > div': {
      marginTop: 15
    },
    '& > div:first-child': {
      marginTop: 0
    },
    '& > div > div': {
      margin: [[0, 5, 0, 5]]
    },
    '& > div > div > span': {
      lineHeight: '120%',
      color: fontColor,
      fontSize: fontSize5,
      fontFamily: fontMonospaced,
      fontWeight: 500
    },
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  resetToDefault: {
    width: 145
  },
  messageWithTooltip: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }
}

export default styles
