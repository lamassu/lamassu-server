import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import { gql } from 'apollo-boost'
import * as R from 'ramda'
import React, { useState } from 'react'

import ErrorMessage from 'src/components/ErrorMessage'
import Modal from 'src/components/Modal'
import Title from 'src/components/Title'
import {
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td
} from 'src/components/fake-table/Table'
import { Switch } from 'src/components/inputs'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { zircon } from 'src/styling/variables'

import Wizard from './Wizard'
import WizardSplash from './WizardSplash'
import {
  CRYPTOCURRENCY_KEY,
  TICKER_KEY,
  WALLET_KEY,
  EXCHANGE_KEY,
  ZERO_CONF_KEY,
  EDIT_KEY,
  ENABLE_KEY,
  SIZE_KEY,
  TEXT_ALIGN_KEY
} from './aux.js'

const styles = {
  disabledDrawing: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    '& > div': {
      position: 'absolute',
      backgroundColor: zircon,
      height: 36,
      width: 678
    }
  },
  modal: {
    width: 544
  },
  switchErrorMessage: {
    margin: [['auto', 0, 'auto', 20]]
  }
}

const useStyles = makeStyles(styles)

const columns = {
  [CRYPTOCURRENCY_KEY]: {
    [SIZE_KEY]: 182,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [TICKER_KEY]: {
    [SIZE_KEY]: 182,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [WALLET_KEY]: {
    [SIZE_KEY]: 182,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [EXCHANGE_KEY]: {
    [SIZE_KEY]: 182,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [ZERO_CONF_KEY]: {
    [SIZE_KEY]: 229,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [EDIT_KEY]: {
    [SIZE_KEY]: 134,
    [TEXT_ALIGN_KEY]: 'center'
  },
  [ENABLE_KEY]: {
    [SIZE_KEY]: 109,
    [TEXT_ALIGN_KEY]: 'center'
  }
}

const GET_INFO = gql`
  {
    config
    accounts {
      code
      display
      class
      cryptos
    }
    cryptoCurrencies {
      code
      display
    }
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const schema = {
  [TICKER_KEY]: '',
  [WALLET_KEY]: '',
  [EXCHANGE_KEY]: '',
  [ZERO_CONF_KEY]: '',
  [ENABLE_KEY]: false
}

const WalletSettings = () => {
  const [cryptoCurrencies, setCryptoCurrencies] = useState(null)
  const [accounts, setAccounts] = useState(null)
  const [services, setServices] = useState(null)
  const [state, setState] = useState(null)
  const [modalContent, setModalContent] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState(null)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      setServices(data.saveConfig.accounts)
      setError(null)
    }
  })

  useQuery(GET_INFO, {
    onCompleted: data => {
      const { cryptoCurrencies, config, accounts } = data

      const wallet = config?.wallet ?? []
      const services = config?.accounts ?? {}

      const newState = R.map(crypto => {
        const el = R.find(R.propEq(CRYPTOCURRENCY_KEY, crypto.code))(wallet)
        if (!el) return R.assoc(CRYPTOCURRENCY_KEY, crypto.code)(schema)
        return el
      })(cryptoCurrencies)

      setState(newState)
      setCryptoCurrencies(cryptoCurrencies)
      setAccounts(accounts)
      setServices(services)
    },
    onError: error => console.error(error)
  })

  const classes = useStyles()

  const getSize = key => columns[key][SIZE_KEY]
  const getTextAlign = key => columns[key][TEXT_ALIGN_KEY]

  const getDisplayName = list => code =>
    R.path(['display'], R.find(R.propEq('code', code), list))

  const getCryptoDisplayName = row =>
    getDisplayName(cryptoCurrencies)(row[CRYPTOCURRENCY_KEY])

  const getNoSetUpNeeded = accounts => {
    const needs = [
      'bitgo',
      'bitstamp',
      'blockcypher',
      'infura',
      'kraken',
      'strike'
    ]
    return R.filter(account => !R.includes(account.code, needs), accounts)
  }
  const getAlreadySetUp = serviceClass => cryptocode => {
    const possible = R.filter(
      service => R.includes(cryptocode, service.cryptos),
      R.filter(R.propEq('class', serviceClass), accounts)
    )
    const isSetUp = service => R.includes(service.code, R.keys(services))
    const alreadySetUp = R.filter(isSetUp, possible)
    const join = [...alreadySetUp, ...getNoSetUpNeeded(possible)]
    return R.isEmpty(join) ? null : join
  }
  const getNotSetUp = serviceClass => cryptocode => {
    const possible = R.filter(
      service => R.includes(cryptocode, service.cryptos),
      R.filter(R.propEq('class', serviceClass), accounts)
    )
    const without = R.without(
      getAlreadySetUp(serviceClass)(cryptocode) ?? [],
      possible
    )
    return R.isEmpty(without) ? null : without
  }

  const saveNewService = (code, it) => {
    const newAccounts = R.clone(services)
    newAccounts[code] = it
    return saveConfig({ variables: { config: { accounts: newAccounts } } })
  }
  const save = it => {
    const idx = R.findIndex(
      R.propEq(CRYPTOCURRENCY_KEY, it[CRYPTOCURRENCY_KEY]),
      state
    )
    const merged = R.mergeDeepRight(state[idx], it)
    const updated = R.update(idx, merged, state)
    return saveConfig({
      variables: { config: { wallet: updated } }
    })
  }

  const isSet = crypto =>
    crypto[TICKER_KEY] &&
    crypto[WALLET_KEY] &&
    crypto[EXCHANGE_KEY] &&
    crypto[ZERO_CONF_KEY]

  const handleEnable = row => event => {
    if (!isSet(row)) {
      setModalContent(
        <WizardSplash
          code={row[CRYPTOCURRENCY_KEY]}
          coinName={getCryptoDisplayName(row)}
          handleModalNavigation={handleModalNavigation(row)}
        />
      )
      setModalOpen(true)
      setError(null)
      return
    }

    save(R.assoc(ENABLE_KEY, event.target.checked, row)).catch(error =>
      setError(error)
    )
  }

  const handleEditClick = row => {
    setModalOpen(true)
    handleModalNavigation(row)(1)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalContent(null)
  }
  const handleModalNavigation = row => currentPage => {
    const cryptocode = row[CRYPTOCURRENCY_KEY]

    switch (currentPage) {
      case 1:
        setModalContent(
          <Wizard
            crypto={row}
            coinName={getCryptoDisplayName(row)}
            handleModalNavigation={handleModalNavigation}
            pageName={TICKER_KEY}
            currentStage={1}
            alreadySetUp={R.filter(
              ticker => R.includes(cryptocode, ticker.cryptos),
              R.filter(R.propEq('class', 'ticker'), accounts)
            )}
          />
        )
        break
      case 2:
        setModalContent(
          <Wizard
            crypto={row}
            coinName={getCryptoDisplayName(row)}
            handleModalNavigation={handleModalNavigation}
            pageName={WALLET_KEY}
            currentStage={2}
            alreadySetUp={getAlreadySetUp(WALLET_KEY)(cryptocode)}
            notSetUp={getNotSetUp(WALLET_KEY)(cryptocode)}
            saveNewService={saveNewService}
          />
        )
        break
      case 3:
        setModalContent(
          <Wizard
            crypto={row}
            coinName={getCryptoDisplayName(row)}
            handleModalNavigation={handleModalNavigation}
            pageName={EXCHANGE_KEY}
            currentStage={3}
            alreadySetUp={getAlreadySetUp(EXCHANGE_KEY)(cryptocode)}
            notSetUp={getNotSetUp(EXCHANGE_KEY)(cryptocode)}
            saveNewService={saveNewService}
          />
        )
        break
      case 4:
        setModalContent(
          <Wizard
            crypto={row}
            coinName={getCryptoDisplayName(row)}
            handleModalNavigation={handleModalNavigation}
            pageName={ZERO_CONF_KEY}
            currentStage={4}
            alreadySetUp={getAlreadySetUp(ZERO_CONF_KEY)(cryptocode)}
            notSetUp={getNotSetUp(ZERO_CONF_KEY)(cryptocode)}
            saveNewService={saveNewService}
          />
        )
        break
      case 5:
        // Zero Conf
        return save(R.assoc(ENABLE_KEY, true, row)).then(m => {
          setModalOpen(false)
          setModalContent(null)
        })
      default:
        break
    }

    return new Promise(() => {})
  }

  if (!state) return null

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Wallet Settings</Title>
          {error && !modalOpen && (
            <ErrorMessage className={classes.switchErrorMessage}>
              Failed to save
            </ErrorMessage>
          )}
        </div>
      </div>
      <div className={classes.wrapper}>
        <Table>
          <THead>
            <Th
              size={getSize(CRYPTOCURRENCY_KEY)}
              textAlign={getTextAlign(CRYPTOCURRENCY_KEY)}>
              Cryptocurrency
            </Th>
            <Th size={getSize(TICKER_KEY)} textAlign={getTextAlign(TICKER_KEY)}>
              Ticker
            </Th>
            <Th size={getSize(WALLET_KEY)} textAlign={getTextAlign(WALLET_KEY)}>
              Wallet
            </Th>
            <Th
              size={getSize(EXCHANGE_KEY)}
              textAlign={getTextAlign(EXCHANGE_KEY)}>
              Exchange
            </Th>
            <Th
              size={getSize(ZERO_CONF_KEY)}
              textAlign={getTextAlign(ZERO_CONF_KEY)}>
              Zero Conf
            </Th>
            <Th size={getSize(EDIT_KEY)} textAlign={getTextAlign(EDIT_KEY)}>
              Edit
            </Th>
            <Th size={getSize(ENABLE_KEY)} textAlign={getTextAlign(ENABLE_KEY)}>
              Enable
            </Th>
          </THead>
          <TBody>
            {state.map((row, idx) => (
              <Tr key={idx}>
                <Td
                  size={getSize(CRYPTOCURRENCY_KEY)}
                  textAlign={getTextAlign(CRYPTOCURRENCY_KEY)}>
                  {getCryptoDisplayName(row)}
                </Td>
                {!isSet(row) && (
                  <Td
                    size={
                      getSize(TICKER_KEY) +
                      getSize(WALLET_KEY) +
                      getSize(EXCHANGE_KEY) +
                      getSize(ZERO_CONF_KEY)
                    }
                    textAlign="center"
                    className={classes.disabledDrawing}>
                    <div />
                  </Td>
                )}
                {isSet(row) && (
                  <>
                    <Td
                      size={getSize(TICKER_KEY)}
                      textAlign={getTextAlign(TICKER_KEY)}>
                      {getDisplayName(accounts)(row[TICKER_KEY])}
                    </Td>
                    <Td
                      size={getSize(WALLET_KEY)}
                      textAlign={getTextAlign(WALLET_KEY)}>
                      {getDisplayName(accounts)(row[WALLET_KEY])}
                    </Td>
                    <Td
                      size={getSize(EXCHANGE_KEY)}
                      textAlign={getTextAlign(EXCHANGE_KEY)}>
                      {getDisplayName(accounts)(row[EXCHANGE_KEY])}
                    </Td>
                    <Td
                      size={getSize(ZERO_CONF_KEY)}
                      textAlign={getTextAlign(ZERO_CONF_KEY)}>
                      {getDisplayName(accounts)(row[ZERO_CONF_KEY])}
                    </Td>
                  </>
                )}
                <Td size={getSize(EDIT_KEY)} textAlign={getTextAlign(EDIT_KEY)}>
                  {!isSet(row) && <DisabledEditIcon />}
                  {isSet(row) && (
                    <button
                      className={classes.iconButton}
                      onClick={() => handleEditClick(row)}>
                      <EditIcon />
                    </button>
                  )}
                </Td>
                <Td
                  size={getSize(ENABLE_KEY)}
                  textAlign={getTextAlign(ENABLE_KEY)}>
                  <Switch
                    checked={row[ENABLE_KEY]}
                    onChange={handleEnable(row)}
                    value={row[CRYPTOCURRENCY_KEY]}
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
      <Modal
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        open={modalOpen}
        handleClose={handleModalClose}
        className={classes.modal}>
        {modalContent}
      </Modal>
    </>
  )
}

export default WalletSettings
