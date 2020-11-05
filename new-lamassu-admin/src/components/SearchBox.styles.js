import baseButtonStyles from 'src/components/buttons/BaseButton.styles'
import { bySize, bold } from 'src/styling/helpers'
import { zircon, comet } from 'src/styling/variables'

const { baseButton } = baseButtonStyles

const searchBoxBorderRadius = baseButton.height / 2
const searchBoxHeight = 32
const popupBorderRadiusFocus = baseButton.height / 4

const hoverColor = 'rgba(0, 0, 0, 0.08)'

export default {
  size: ({ size }) => ({
    marginTop: size === 'lg' ? 0 : 2,
    ...bySize(size)
  }),
  bold,
  autocomplete: {
    '&[data-focus="true"]': {
      backgroundColor: hoverColor
    }
  },
  popup: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: [[0, 0, popupBorderRadiusFocus, popupBorderRadiusFocus]],
    backgroundColor: zircon
  },
  separator: {
    width: '88%',
    height: 1,
    margin: '0 auto',
    border: 'solid 0.5px',
    borderColor: comet
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: 36,
    alignItems: 'center'
  },
  itemLabel: {
    margin: [0],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  itemType: {
    marginLeft: 'auto',
    fontSize: 12,
    color: comet,
    margin: [0]
  },
  input: {
    display: 'flex',
    flex: 1,
    width: 273,
    padding: [[8, 12]],
    alignItems: 'center',
    height: searchBoxHeight,
    borderRadius: searchBoxBorderRadius,
    backgroundColor: zircon
  },
  inputWithPopup: {
    borderRadius: [[popupBorderRadiusFocus, popupBorderRadiusFocus, 0, 0]]
  },
  iconButton: {
    marginRight: 12
  }
}
