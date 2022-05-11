import { zircon, backgroundColor } from 'src/styling/variables'

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
  }
}
