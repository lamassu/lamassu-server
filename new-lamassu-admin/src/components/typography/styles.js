import {
  fontColor,
  fontSize1,
  fontSize2,
  fontSize3,
  fontSize4,
  fontSize5,
  fontPrimary,
  fontSecondary,
  fontMonospaced,
} from 'src/styling/variables'

const base = {
  lineHeight: '110%',
  color: fontColor,
}

export default {
  h1: {
    extend: base,
    fontSize: fontSize1,
    fontFamily: fontPrimary,
    fontWeight: 900,
  },
  h2: {
    extend: base,
    fontSize: fontSize2,
    fontFamily: fontPrimary,
    fontWeight: 900,
  },
  h3: {
    extend: base,
    fontSize: fontSize4,
    fontFamily: fontPrimary,
    fontWeight: 900,
  },
  h4: {
    extend: base,
    fontSize: fontSize4,
    fontFamily: fontPrimary,
    fontWeight: 700,
  },
  p: {
    extend: base,
    fontSize: fontSize4,
    fontFamily: fontSecondary,
    fontWeight: 500,
  },
  tl1: {
    extend: base,
    fontSize: fontSize2,
    fontFamily: fontSecondary,
    fontWeight: 700,
  },
  tl2: {
    extend: base,
    fontSize: fontSize4,
    fontFamily: fontSecondary,
    fontWeight: 700,
  },
  info1: {
    extend: base,
    fontSize: fontSize1,
    fontFamily: fontSecondary,
    fontWeight: 700,
  },
  info2: {
    extend: base,
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 700,
  },
  info3: {
    extend: base,
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 500,
  },
  mono: {
    extend: base,
    fontSize: fontSize4,
    fontFamily: fontMonospaced,
    fontWeight: 500,
  },
  monoBold: {
    fontWeight: 700,
  },
  monoSmall: {
    fontSize: fontSize5,
  },
  inputFont: {
    fontSize: fontSize2,
    fontFamily: fontSecondary,
    fontWeight: 500,
    lineHeight: '110%',
    color: fontColor,
  },
  regularLabel: {
    fontSize: fontSize4,
    fontFamily: fontSecondary,
    fontWeight: 500,
    lineHeight: '110%',
  },
  label1: {
    fontSize: fontSize5,
    fontFamily: fontSecondary,
    fontWeight: 500,
    color: fontColor,
  },
  label2: {
    fontSize: fontSize5,
    fontFamily: fontSecondary,
    fontWeight: 700,
    color: fontColor,
  },
  label3: {
    fontSize: fontSize4,
    fontFamily: fontSecondary,
    fontWeight: 500,
    color: fontColor,
  },
  inline: {
    display: 'inline',
  },
  noMarginP: {
    margin: 0,
  },
}
