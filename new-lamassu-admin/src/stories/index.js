import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import {
  MuiThemeProvider,
  createMuiTheme,
  StylesProvider,
  jssPreset
} from '@material-ui/core/styles'
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { create } from 'jss'
import extendJss from 'jss-plugin-extend'
import React from 'react'

import { ReactComponent as AuthorizeIconReversed } from 'src/styling/icons/button/authorize/white.svg'
import { ReactComponent as AuthorizeIcon } from 'src/styling/icons/button/authorize/zodiac.svg'
import { ActionButton, Button, Link } from 'src/components/buttons'
import { Radio, TextInput, Switch } from 'src/components/inputs'

import ConfirmDialog from '../components/ConfirmDialog'
import {
  H1,
  H2,
  H3,
  TL1,
  TL2,
  P,
  Info1,
  Info2,
  Mono
} from '../components/typography'
import { inputFontFamily, secondaryColor } from '../styling/variables'

const jss = create({
  plugins: [extendJss(), ...jssPreset().plugins]
})

const Wrapper = ({ children }) => (
  <StylesProvider jss={jss}>
    <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
  </StylesProvider>
)

const story = storiesOf('Components', module)
story.addDecorator(withKnobs)

const colors = {
  Primary: 'primary',
  Secondary: 'secondary'
}

const linkColors = {
  Primary: 'primary',
  Secondary: 'secondary',
  'No Color': 'no-color'
}

const sizes = {
  Large: 'lg',
  Small: 'sm'
}

const theme = createMuiTheme({
  typography: {
    fontFamily: inputFontFamily
  },
  MuiButtonBase: {
    disableRipple: true
  },
  palette: {
    primary: {
      light: secondaryColor,
      dark: secondaryColor,
      main: secondaryColor
    },
    secondary: {
      light: secondaryColor,
      dark: secondaryColor,
      main: secondaryColor
    }
  }
})

story.add('Button', () => (
  <Wrapper>
    <Button
      disabled={boolean('Disabled', false)}
      size={select('Size', sizes, 'lg')}>
      {text('Label', 'Button')}
    </Button>
  </Wrapper>
))

story.add('Action Button', () => (
  <Wrapper>
    <ActionButton
      disabled={boolean('Disabled', false)}
      color={select('Color', linkColors, 'primary')}
      Icon={AuthorizeIcon}
      InverseIcon={AuthorizeIconReversed}>
      {text('Label', 'Button')}
    </ActionButton>
  </Wrapper>
))

story.add('Text Button', () => (
  <Wrapper>
    <Link color={select('Color', linkColors, 'primary')}>
      {text('Label', 'Text Button')}
    </Link>
  </Wrapper>
))

story.add('Switch', () => (
  <Wrapper>
    <FormControlLabel control={<Switch value="checkedB" />} label="iOS style" />
    <Switch label="hehe" disabled />
  </Wrapper>
))

story.add('Text Input', () => (
  <Wrapper>
    <TextInput
      name="text-input"
      touched={[]}
      color={select('Color', colors, 'amazonite')}
    />
  </Wrapper>
))

story.add('Checkbox', () => (
  <Wrapper>
    <Checkbox
      value="checkedC"
      inputProps={{
        'aria-label': 'uncontrolled-checkbox'
      }}
    />

    <Checkbox
      value="checkedB"
      inputProps={{
        'aria-label': 'uncontrolled-checkbox'
      }}
    />
  </Wrapper>
))

story.add('ConfirmDialog', () => (
  <Wrapper>
    <ConfirmDialog
      open={boolean('open', true)}
      onDissmised={() => {
        window.alert('dissmised')
      }}
      onConfirmed={() => {
        window.alert('confirmed')
      }}
      toBeConfirmed="there-is-no-fate"
    />
  </Wrapper>
))

story.add('Radio', () => <Radio label="Hehe" />)

const typographyStory = storiesOf('Typography', module)
typographyStory.add('H1', () => <H1>Hehehe</H1>)

typographyStory.add('H2', () => <H2>Hehehe</H2>)

typographyStory.add('H3', () => <H3>Hehehe</H3>)

typographyStory.add('TL1', () => <TL1>Hehehe</TL1>)

typographyStory.add('TL2', () => <TL2>Hehehe</TL2>)

typographyStory.add('P', () => <P>Hehehe</P>)

typographyStory.add('Info1', () => <Info1>Hehehe</Info1>)

typographyStory.add('Info2', () => <Info2>Hehehe</Info2>)

typographyStory.add('Mono', () => <Mono>Hehehe</Mono>)
