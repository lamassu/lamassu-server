import typographyStyles from 'src/components/typography/styles'
import { zircon, backgroundColor, offColor } from 'src/styling/variables'

const { p } = typographyStyles

export default {
  photo: {
    width: 135,
    height: 135,
    borderRadius: 8,
    backgroundColor: zircon,
    margin: [[0, 28, 0, 0]],
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  img: {
    objectFit: 'cover',
    objectPosition: 'center',
    width: 135,
    height: 135
  },
  container: {
    position: 'relative',
    '& > img': {
      display: 'block'
    },
    '& > circle': {
      position: 'absolute',
      top: '0',
      right: '0',
      marginRight: 5,
      marginTop: 5
    }
  },
  circle: {
    background: backgroundColor,
    borderRadius: '50%',
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  label: {
    color: offColor,
    margin: [[0, 0, 6, 0]]
  },
  firstRow: {
    padding: [[8]]
  },
  secondRow: {
    extend: p,
    display: 'flex',
    padding: [[8]],
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      '& > div': {
        width: 144,
        height: 37,
        marginBottom: 15,
        marginRight: 55
      }
    }
  },
  carousel: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    width: 550,
    height: 550
  },
  carouselImg: {
    objectFit: 'cover',
    objectPosition: 'center',
    width: 550,
    height: 550,
    marginBottom: 40
  }
}
