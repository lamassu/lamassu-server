const Yup = require('yup')
const R = require('ramda')
const utils = require('./utils.js')
const { CURRENCY_MAX,
        PASSWORD_MIN_LENGTH,
        percentMax,
        percentMin,
        notesMin,
        ALL_COINS,
        ALL_MACHINES,
        CASSETTE_LIST,
        CASSETTE_1_KEY,
        CASSETTE_2_KEY,
        CASSETTE_3_KEY,
        CASSETTE_4_KEY,
        MACHINE_KEY } = require('./consts.js')

const WALLET = {
  DEFAULT: Yup.object().shape({
    ticker: Yup.string().required(),
    wallet: Yup.string().required(),
    exchange: Yup.string().required(),
    zeroConf: Yup.string(),
    zeroConfLimit: Yup.number()
      .integer()
      .min(0)
      .max(CURRENCY_MAX)
      .transform(utils.transformNumber)
  }),
  OVERRIDES: Yup.object().shape({
    cryptoUnits: Yup.string().required(),
    feeMultiplier: Yup.string()
      .default(() => '1')
      .required(),
    cryptoCurrency: Yup.string().required(),
    allowTransactionBatching: Yup.boolean()
      .default(() => false)
      .required()
  }),
  ADVANCED: Yup.object().shape({
    cryptoUnits: Yup.string().required(),
    feeMultiplier: Yup.string().required(),
    allowTransactionBatching: Yup.boolean()
  }),
  CHOOSE_COIN: Yup.object().shape({
    coin: Yup.string().required()
  }),
  WIZARD: Yup.object().shape({
    zeroConfLimit: Yup.number().required()
  })
}

const OPERATOR_INFO = {
  CONTACT_INFO: Yup.object().shape({
    active: Yup.boolean(),
    name: Yup.string(),
    phone: Yup.string(),
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('An email is required'),
    website: Yup.string(),
    companyNumber: Yup.string()
  }),
  TERMS_CONDITIONS: Yup.object().shape({
    title: Yup.string()
      .required()
      .max(50, 'Too long'),
    text: Yup.string().required(),
    acceptButtonText: Yup.string()
      .required()
      .max(50, 'Too long'),
    cancelButtonText: Yup.string()
      .required()
      .max(50, 'Too long')
  }),
  SMS_NOTICES: {
    DEFAULT: event =>
      Yup.object().shape({
        event: Yup.string().required('An event is required!'),
        message:
          utils.PREFILL[event]?.validator ??
          Yup.string()
            .required('The message content is required!')
            .trim()
      })
  },
  BOOLEAN_PROPERTIES_TABLE: Yup.boolean().required(),
}

const ADD_MACHINE = Yup.object().shape({
  name: Yup.string()
    .required('Machine name is required.')
    .max(50)
    .test(
      'unique-name',
      'Machine name is already in use.',
      (value, context) =>
        !R.any(
          it => R.equals(R.toLower(it), R.toLower(value)),
          context.options.context.machineNames
        )
    )
})

const AUTHENTICATION = {
  INPUT_FIDO: Yup.object().shape({
    localClient: Yup.string()
      .required('Client field is required!')
      .email('Username field should be in an email format!'),
    localRememberMe: Yup.boolean()
  }),
  LOGIN: Yup.object().shape({
    email: Yup.string()
      .label('Email')
      .required()
      .email(),
    password: Yup.string().required('Password field is required'),
    rememberMe: Yup.boolean()
  }),
  REGISTER: Yup.object({
    password: Yup.string()
      .required('A password is required')
      .min(
        PASSWORD_MIN_LENGTH,
        `Your password must contain at least ${PASSWORD_MIN_LENGTH} characters`
      ),
    confirmPassword: Yup.string()
      .required('Please confirm the password')
      .oneOf([Yup.ref('password')], 'Passwords must match')
  }),
  RESET_PASSWORD: Yup.object().shape({
    password: Yup.string()
      .required('A new password is required')
      .test(
        'len',
        'New password must contain more than 8 characters',
        val => val.length >= PASSWORD_MIN_LENGTH
      ),
    confirmPassword: Yup.string().oneOf(
      [Yup.ref('password'), null],
      'Passwords must match'
    )
  })
}

const BLACKLIST_MODAL = Yup.object({
  address: Yup.string()
    .trim()
    .required('An address is required')
})

const CASHOUT = {
  DENOMINATION: Yup.object().shape({
    cassette1: Yup.number()
      .label('Cassette 1')
      .required()
      .min(1)
      .max(CURRENCY_MAX),
    cassette2: Yup.number()
      .label('Cassette 2')
      .required()
      .min(1)
      .max(CURRENCY_MAX),
    cassette3: Yup.number()
      .label('Cassette 3')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(utils.transformNumber),
    cassette4: Yup.number()
      .label('Cassette 4')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(utils.transformNumber)
  }),
  WIZARD: Yup.object().shape({
    cassette1: Yup.number().required(),
    cassette2:
      machine.numberOfCassettes > 1 && step >= 2
        ? Yup.number().required()
        : Yup.number()
            .transform(utils.transformNumber)
            .nullable(),
    cassette3:
      machine.numberOfCassettes > 2 && step >= 3
        ? Yup.number().required()
        : Yup.number()
            .transform(utils.transformNumber)
            .nullable(),
    cassette4:
      machine.numberOfCassettes > 3 && step >= 4
        ? Yup.number().required()
        : Yup.number()
            .transform(utils.transformNumber)
            .nullable()
  })
}

const COMMISSIONS = {
  DEFAULT: bills => Yup.object().shape({
      cashIn: Yup.number()
        .label('Cash-in')
        .min(0)
        .max(percentMax)
        .required(),
      cashOut: Yup.number()
        .label('Cash-out')
        .min(0)
        .max(percentMax)
        .required(),
      fixedFee: Yup.number()
        .label('Fixed Fee')
        .min(0)
        .max(utils.highestBill(bills))
        .required(),
      minimumTx: Yup.number()
        .label('Minimum Tx')
        .min(0)
        .max(utils.highestBill(bills))
        .required()
  }),
  OVERRIDES: (displayCodeArray, getView, machineData, cryptoData) =>
    Yup.object().shape({
      machine: Yup.string()
        .nullable()
        .label('Machine')
        .required(),
      cryptoCurrencies: Yup.array()
        .test({
          test() {
            const { id, machine, cryptoCurrencies } = this.parent
            const alreadyUsed = utils.getAlreadyUsed(id, machine, values)
  
            const isAllMachines = machine === ALL_MACHINES.deviceId
            const isAllCoins = R.includes(ALL_COINS.code, cryptoCurrencies)
            if (isAllMachines && isAllCoins) {
              return this.createError({
                message: `All machines and all coins should be configured in the default setup table`
              })
            }
  
            const repeated = R.intersection(alreadyUsed, cryptoCurrencies)
            if (!R.isEmpty(repeated)) {
              const codes = displayCodeArray(cryptoData)(repeated)
              const machineView = getView(
                machineData,
                'name',
                'deviceId'
              )(machine)
  
              const message = `${codes} already overriden for machine: ${machineView}`
  
              return this.createError({ message })
            }
            return true
          }
        })
        .label('Crypto Currencies')
        .required()
        .min(1),
      cashIn: Yup.number()
        .label('Cash-in')
        .min(0)
        .max(percentMax)
        .required(),
      cashOut: Yup.number()
        .label('Cash-out')
        .min(0)
        .max(percentMax)
        .required(),
      fixedFee: Yup.number()
        .label('Fixed Fee')
        .min(0)
        .max(highestBill)
        .required(),
      minimumTx: Yup.number()
        .label('Minimum Tx')
        .min(0)
        .max(highestBill)
        .required()
    }),
  LIST: bills => Yup.object().shape({
    machine: Yup.string()
      .label('Machine')
      .required(),
    cryptoCurrencies: Yup.array()
      .label('Crypto Currency')
      .required()
      .min(1),
    cashIn: Yup.number()
      .label('Cash-in')
      .min(0)
      .max(percentMax)
      .required(),
    cashOut: Yup.number()
      .label('Cash-out')
      .min(0)
      .max(percentMax)
      .required(),
    fixedFee: Yup.number()
      .label('Fixed Fee')
      .min(0)
      .max(utils.highestBill(bills))
      .required(),
    minimumTx: Yup.number()
      .label('Minimum Tx')
      .min(0)
      .max(utils.highestBill(bills))
      .required()
  })
}

const CUSTOMERS = {
  CUSTOMER_DATA: {
    SMS: Yup.lazy(values => {
      const additionalData = R.omit(['phoneNumber'])(values)
      const fields = R.keys(additionalData)
      if (R.length(fields) === 2) {
        return Yup.object().shape({
          [R.head(fields)]: Yup.string().required(),
          [R.last(fields)]: Yup.string().required()
        })
      }
    }),
    CUSTOM_FIELDS: value => Yup.object().shape({
        [value]: Yup.string()
    }),
    ENTRY_TYPE: Yup.lazy(values => {
      if (values.entryType === 'custom') {
        return Yup.object().shape({
          entryType: Yup.string().required(),
          dataType: Yup.string().required()
        })
      } else if (values.entryType === 'requirement') {
        return Yup.object().shape({
          entryType: Yup.string().required(),
          requirement: Yup.string().required()
        })
      }
    }),
    CUSTOM_FILE: Yup.object().shape({
      title: Yup.string().required(),
      file: Yup.mixed().required()
    }),
    CUSTOM_IMAGE: Yup.object().shape({
      title: Yup.string().required(),
      image: Yup.mixed().required()
    }),
    CUSTOM_TEXT: Yup.object().shape({
      title: Yup.string().required(),
      data: Yup.string().required()
    }),
    ID_CARD_DATA: Yup.object().shape({
      firstName: Yup.string().required(),
      lastName: Yup.string().required(),
      documentNumber: Yup.string().required(),
      dateOfBirth: Yup.string()
        .test({
          test: val => isValid(parse(new Date(), 'yyyy-MM-dd', val))
        })
        .required(),
      gender: Yup.string().required(),
      country: Yup.string().required(),
      expirationDate: Yup.string()
        .test({
          test: val => isValid(parse(new Date(), 'yyyy-MM-dd', val))
        })
        .required()
    }),
    US_SSN: Yup.object().shape({
      usSsn: Yup.string().required()
    }),
    ID_CARD_PHOTO: Yup.object().shape({
      idCardPhoto: Yup.mixed().required()
    }),
    FRONT_CAMERA: Yup.object().shape({
      frontCamera: Yup.mixed().required()
    })
  },
  CUSTOMER_MODAL: (pnUtilInstance, countryCodes) =>
    Yup.object().shape({
      phoneNumber: Yup.string()
        .required('A phone number is required')
        .test('is-valid-number', 'That is not a valid phone number', value => {
          try {
            const validMap = R.map(it => {
              const number = pnUtilInstance.parseAndKeepRawInput(value, it)
              return pnUtilInstance.isValidNumber(number)
            }, countryCodes)
  
            return R.any(it => it === true, validMap)
          } catch (e) {}
        })
        .trim()
    }),
  NOTE_MODAL: Yup.object().shape({
    title: Yup.string()
      .required()
      .trim()
      .max(25),
    content: Yup.string().required()
  }),
  NOTE_EDIT: Yup.object().shape({
    content: Yup.string()
  })
}

const LOCALES = {
  DEFAULT: Yup.object().shape({
    country: Yup.string()
      .label('Country')
      .required(),
    fiatCurrency: Yup.string()
      .label('Fiat Currency')
      .required(),
    languages: Yup.array()
      .label('Languages')
      .required()
      .min(1)
      .max(4),
    cryptoCurrencies: Yup.array()
      .label('Crypto Currencies')
      .required()
      .min(1),
    timezone: Yup.string()
      .label('Timezone')
      .required()
  }),
  OVERRIDES: Yup.object().shape({
    machine: Yup.string()
      .label('Machine')
      .required(),
    country: Yup.string()
      .label('Country')
      .required(),
    languages: Yup.array()
      .label('Languages')
      .required()
      .min(1)
      .max(4),
    cryptoCurrencies: Yup.array()
      .label('Crypto Currencies')
      .required()
      .min(1)
  })
}

const LOYALTY = {
  DISCOUNT_MODAL: Yup.object().shape({
    customer: Yup.string().required('A customer is required!'),
    discount: Yup.number()
      .required('A discount rate is required!')
      .min(0, 'Discount rate should be a positive number!')
      .max(100, 'Discount rate should have a maximum value of 100%!')
  }),
  PROMO_CODES_MODAL: Yup.object().shape({
    code: Yup.string()
      .required()
      .trim()
      .max(25),
    discount: Yup.number()
      .required()
      .min(0)
      .max(100)
  })
}

const MACHINES = {
  CASSETTES: Yup.object().shape({
    name: Yup.string().required('Required'),
    cashbox: Yup.number()
      .label('Cash box')
      .required()
      .integer()
      .min(0)
      .max(1000),
    cassette1: Yup.number()
      .required('Required')
      .integer()
      .min(0)
      .max(500),
    cassette2: Yup.number()
      .required('Required')
      .integer()
      .min(0)
      .max(500),
    cassette3: Yup.number()
      .required('Required')
      .integer()
      .min(0)
      .max(500),
    cassette4: Yup.number()
      .required('Required')
      .integer()
      .min(0)
      .max(500)
  })
}

const MAINTENANCE = {
  CASSETTES: Yup.object().shape({
    name: Yup.string().required(),
    cashbox: Yup.number()
      .label('Cash box')
      .required()
      .integer()
      .min(0)
      .max(1000),
    cassette1: Yup.number()
      .label('Cassette 1')
      .required()
      .integer()
      .min(0)
      .max(500),
    cassette2: Yup.number()
      .label('Cassette 2')
      .required()
      .integer()
      .min(0)
      .max(500),
    cassette3: Yup.number()
      .label('Cassette 3')
      .required()
      .integer()
      .min(0)
      .max(500),
    cassette4: Yup.number()
      .label('Cassette 4')
      .required()
      .integer()
      .min(0)
      .max(500)
  }),
  WIZARD: {
    CASSETTES: (defaultCapacity, cassetteNumber) => Yup.object().shape({
      [`cassette${cassetteNumber}`]: Yup.number()
        .label('Bill count')
        .positive()
        .integer()
        .required()
        .min(0)
        .max(defaultCapacity)
    }),
    CASHBOX_EMPTIED: Yup.object().shape({
      wasCashboxEmptied: Yup.string().required('Select one option.')
    })
  }
}

const NOTIFICATIONS = {
  SINGLE_FIELD_EDITABLE_NUMBER: name => Yup.object().shape({
    [name]: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable()
  }),
  CRYPTO_BALANCE_OVERRIDES: (cryptoCurrencyKey, lowBalanceKey, highBalanceKey) => 
    Yup.object().shape({
        [cryptoCurrencyKey]: Yup.string()
          .label('Cryptocurrency')
          .nullable()
          .required(),
        [lowBalanceKey]: Yup.number()
          .label('Low Balance')
          .when(highBalanceKey, {
            is: highBalanceKey => !highBalanceKey,
            then: Yup.number().required()
          })
          .transform(transformNumber)
          .integer()
          .min(notesMin)
          .max(CURRENCY_MAX)
          .nullable(),
        [highBalanceKey]: Yup.number()
          .label('High Balance')
          .when(lowBalanceKey, {
            is: lowBalanceKey => !lowBalanceKey,
            then: Yup.number().required()
          })
          .transform(transformNumber)
          .integer()
          .min(notesMin)
          .max(CURRENCY_MAX)
          .nullable()
      }, 
    [lowBalanceKey, highBalanceKey]),
  FIAT_BALANCE_ALERTS: (max, min) => Yup.object().shape({
    fillingPercentageCassette1: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable(),
    fillingPercentageCassette2: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable(),
    fiatBalanceCassette3: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable(),
    fiatBalanceCassette4: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable()
  }),
  FIAT_BALANCE_ALERTS_OVERRIDES: Yup.object()
    .shape({
      [MACHINE_KEY]: Yup.string()
        .label('Machine')
        .nullable()
        .required(),
      [CASSETTE_1_KEY]: Yup.number()
        .label('Cassette 1')
        .transform(transformNumber)
        .integer()
        .min(percentMin)
        .max(percentMax)
        .nullable(),
      [CASSETTE_2_KEY]: Yup.number()
        .label('Cassette 2')
        .transform(transformNumber)
        .integer()
        .min(percentMin)
        .max(percentMax)
        .nullable(),
      [CASSETTE_3_KEY]: Yup.number()
        .label('Cassette 3')
        .transform(transformNumber)
        .integer()
        .min(percentMin)
        .max(percentMax)
        .nullable(),
      [CASSETTE_4_KEY]: Yup.number()
        .label('Cassette 4')
        .transform(transformNumber)
        .integer()
        .min(percentMin)
        .max(percentMax)
        .nullable()
    })
    .test((values, context) => {
      const picked = R.pick(CASSETTE_LIST, values)

      if (CASSETTE_LIST.some(it => !R.isNil(picked[it]))) return

      return context.createError({
        path: CASSETTE_1_KEY,
        message: 'At least one of the cassettes must have a value'
      })
  })
}

const SERVICES = {
  BINANCE: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(100, 'The API key is too long')
        .required('The API key is required'),
      privateKey: Yup.string('The private key must be a string')
        .max(100, 'The private key is too long')
        .test(secretTest(account?.privateKey, 'private key'))
    })
  },
  BINANCEUS: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(100, 'The API key is too long')
        .required('The API key is required'),
      privateKey: Yup.string('The private key must be a string')
        .max(100, 'The private key is too long')
        .test(secretTest(account?.privateKey, 'private key'))
    })
  },
  BITGO: account => {
    return Yup.object().shape({
      token: Yup.string('The token must be a string')
        .max(100, 'The token is too long')
        .required('The token is required'),
      BTCWalletId: Yup.string('The BTC wallet ID must be a string').max(
        100,
        'The BTC wallet ID is too long'
      ),
      BTCWalletPassphrase: utils.buildTestValidation(
        'BTCWalletId',
        account?.BTCWalletPassphrase
      ),
      LTCWalletId: Yup.string('The LTC wallet ID must be a string').max(
        100,
        'The LTC wallet ID is too long'
      ),
      LTCWalletPassphrase: utils.buildTestValidation(
        'LTCWalletId',
        account?.LTCWalletPassphrase
      ),
      ZECWalletId: Yup.string('The ZEC wallet ID must be a string').max(
        100,
        'The ZEC wallet ID is too long'
      ),
      ZECWalletPassphrase: utils.buildTestValidation(
        'ZECWalletId',
        account?.ZECWalletPassphrase
      ),
      BCHWalletId: Yup.string('The BCH wallet ID must be a string').max(
        100,
        'The BCH wallet ID is too long'
      ),
      BCHWalletPassphrase: utils.buildTestValidation(
        'BCHWalletId',
        account?.BCHWalletPassphrase
      ),
      DASHWalletId: Yup.string('The DASH wallet ID must be a string').max(
        100,
        'The DASH wallet ID is too long'
      ),
      DASHWalletPassphrase: utils.buildTestValidation(
        'DASHWalletId',
        account?.DASHWalletPassphrase
      ),
      environment: Yup.string('The environment must be a string')
        .matches(/(prod|test)/)
        .required('The environment is required')
    })
  },
  BITSTAMP: account => {
    return Yup.object().shape({
      clientId: Yup.string('The client ID must be a string')
        .max(100, 'The client ID is too long')
        .required('The client ID is required'),
      key: Yup.string('The API key must be a string')
        .max(100, 'The API key is too long')
        .required('The API key is required'),
      secret: Yup.string('The API secret must be a string')
        .max(100, 'The API secret is too long')
        .test(secretTest(account?.secret, 'API secret'))
    })
  },
  BLOCKCYPHER: Yup.object().shape({
    token: Yup.string('The token must be a string')
      .max(100, 'The token is too long')
      .required('The token is required'),
    confidenceFactor: Yup.number('The confidence factor must be a number')
      .integer('The confidence factor must be an integer')
      .positive('The confidence factor must be positive')
      .required('The confidence factor is required')
  }),
  CEX: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(100, 'The API key is too long')
        .required('The API key is required'),
      privateKey: Yup.string('The private key must be a string')
        .max(100, 'The private key is too long')
        .test(secretTest(account?.privateKey, 'private key'))
    })
  },
  FTX: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(100, 'The API key is too long')
        .required('The API key is required'),
      privateKey: Yup.string('The private key must be a string')
        .max(100, 'The private key is too long')
        .test(secretTest(account?.privateKey, 'private key'))
    })
  },
  CIPHETRACE: account => {
    return Yup.object().shape({
      authorizationValue: Yup.string('The authorization value must be a string')
        .max(100, 'Too long')
        .test(secretTest(account?.authorizationValue, 'authorization value')),
      scoreThreshold: Yup.number('The score threshold must be a number')
        .required('A score threshold is required')
        .min(1, 'The score threshold must be between 1 and 10')
        .max(10, 'The score threshold must be between 1 and 10')
        .integer('The score threshold must be an integer')
        .test(
          'no-leading-zeros',
          'The score threshold must not have leading zeros',
          utils.leadingZerosTest
        )
    })
  },
  INFURA: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The project ID must be a string')
        .max(100, 'The project ID is too long')
        .required('The project ID is required'),
      apiSecret: Yup.string('The project secret must be a string')
        .max(100, 'The project secret is too long')
        .test(secretTest(account?.apiSecret, 'project secret')),
      endpoint: Yup.string('The endpoint must be a string')
        .max(100, 'The endpoint is too long')
        .required('The endpoint is required')
    })
  },
  ITBIT: account => {
    return Yup.object().shape({
      userId: Yup.string('The user ID must be a string')
        .max(100, 'The user ID is too long')
        .required('The user ID is required'),
      walletId: Yup.string('The wallet ID must be a string')
        .max(100, 'The wallet ID is too long')
        .required('The wallet ID is required'),
      clientKey: Yup.string('The client key must be a string')
        .max(100, 'The client key is too long')
        .required('The client key is required'),
      clientSecret: Yup.string('The client secret must be a string')
        .max(100, 'The client secret is too long')
        .test(secretTest(account?.clientSecret, 'client secret'))
    })
  },
  KRAKEN: account => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(100, 'The API key is too long')
        .required('The API key is required'),
      privateKey: Yup.string('The private key must be a string')
        .max(100, 'The private key is too long')
        .test(secretTest(account?.privateKey, 'private key'))
    })
  },
  MAILGUN: Yup.object().shape({
    apiKey: Yup.string('The API key must be a string')
      .max(100, 'The API key is too long')
      .required('The API key is required'),
    domain: Yup.string('The domain must be a string')
      .max(100, 'The domain is too long')
      .required('The domain is required'),
    fromEmail: Yup.string('The from email must be a string')
      .max(100, 'The from email is too long')
      .email('The from email must be a valid email address')
      .required('The from email is required'),
    toEmail: Yup.string('The to email must be a string')
      .max(100, 'The to email is too long')
      .email('The to email must be a valid email address')
      .required('The to email is required')
  }),
  SINGLE_BITGO: code => Yup.object().shape({
    token: Yup.string('The token must be a string')
      .max(100, 'The token is too long')
      .required('The token is required'),
    environment: Yup.string('The environment must be a string')
      .matches(/(prod|test)/)
      .required('The environment is required'),
    [`${code}WalletId`]: Yup.string(`The ${code} wallet ID must be a string`)
      .max(100, `The ${code} wallet ID is too long`)
      .required(`The ${code} wallet ID is required`),
    [`${code}WalletPassphrase`]: Yup.string(
      `The ${code} passphrase must be a string`
    )
      .max(100, `The ${code} wallet passphrase is too long`)
      .required(`The ${code} wallet passphrase is required`)
  }),
  TWILIO: account => {
    return Yup.object().shape({
      accountSid: Yup.string('The account SID must be a string')
        .max(100, 'The account SID is too long')
        .required('The account SID is required'),
      authToken: Yup.string('The auth token must be a string')
        .max(100, 'The auth token is too long')
        .test(secretTest(account?.authToken, 'auth token')),
      fromNumber: Yup.string('The Twilio number must be a string')
        .max(100, 'The Twilio number is too long')
        .required('The Twilio number is required'),
      toNumber: Yup.string('The notifications number must be a string')
        .max(100, 'The notifications number is too long')
        .required('The notifications number is required')
    })
  }
}

const USER_MANAGEMENT = {
  CREATE_USER_MODAL: Yup.object().shape({
    username: Yup.string()
      .email('Username field should be in an email format!')
      .required('Username field is required!'),
    role: Yup.string().required('Role field is required!')
  })
}

const TRIGGERS = {
  TABLE: Yup.object()
    .shape({
      triggerType: utils.triggerType,
      requirement: utils.requirement,
      threshold: utils.threshold
      // direction
    })
    .test(({ threshold, triggerType }, context) => {
      const errorMessages = {
        txAmount: threshold => 'Amount must be greater than or equal to 0',
        txVolume: threshold => {
          const thresholdMessage = 'Volume must be greater than or equal to 0'
          const thresholdDaysMessage = 'Days must be greater than 0'
          const message = []
          if (threshold.threshold < 0) message.push(thresholdMessage)
          if (threshold.thresholdDays <= 0) message.push(thresholdDaysMessage)
          return message.join(', ')
        },
        txVelocity: threshold => {
          const thresholdMessage = 'Transactions must be greater than 0'
          const thresholdDaysMessage = 'Days must be greater than 0'
          const message = []
          if (threshold.threshold <= 0) message.push(thresholdMessage)
          if (threshold.thresholdDays <= 0) message.push(thresholdDaysMessage)
          return message.join(', ')
        },
        consecutiveDays: threshold => 'Days must be greater than 0'
      }
      const thresholdValidator = {
        txAmount: threshold => threshold.threshold >= 0,
        txVolume: threshold =>
          threshold.threshold >= 0 && threshold.thresholdDays > 0,
        txVelocity: threshold =>
          threshold.threshold > 0 && threshold.thresholdDays > 0,
        consecutiveDays: threshold => threshold.thresholdDays > 0
      }
  
      if (triggerType && thresholdValidator[triggerType](threshold)) return
  
      return context.createError({
        path: 'threshold',
        message: errorMessages[triggerType](threshold)
      })
    })
    .test(({ requirement }, context) => {
      const requirementValidator = requirement =>
        requirement.requirement === 'suspend'
          ? requirement.suspensionDays > 0
          : true
  
      if (requirement && requirementValidator(requirement)) return
  
      return context.createError({
        path: 'requirement',
        message: 'Suspension days must be greater than 0'
      })
  }),
  TYPE: Yup.object()
    .shape({
      triggerType: Yup.string().required(),
      threshold: Yup.object({
        threshold: Yup.number()
          .transform(transformNumber)
          .nullable(),
        thresholdDays: Yup.number()
          .transform(transformNumber)
          .nullable()
      })
    })
    .test(({ threshold, triggerType }, context) => {
      const errorMessages = {
        txAmount: threshold => 'Amount must be greater than or equal to 0',
        txVolume: threshold => {
          const thresholdMessage = 'Volume must be greater than or equal to 0'
          const thresholdDaysMessage = 'Days must be greater than 0'
          const message = []
          if (!threshold.threshold || threshold.threshold < 0)
            message.push(thresholdMessage)
          if (!threshold.thresholdDays || threshold.thresholdDays <= 0)
            message.push(thresholdDaysMessage)
          return message.join(', ')
        },
        txVelocity: threshold => {
          const thresholdMessage = 'Transactions must be greater than 0'
          const thresholdDaysMessage = 'Days must be greater than 0'
          const message = []
          if (!threshold.threshold || threshold.threshold <= 0)
            message.push(thresholdMessage)
          if (!threshold.thresholdDays || threshold.thresholdDays <= 0)
            message.push(thresholdDaysMessage)
          return message.join(', ')
        },
        consecutiveDays: threshold => 'Days must be greater than 0'
      }
      const thresholdValidator = {
        txAmount: threshold => threshold.threshold >= 0,
        txVolume: threshold =>
          threshold.threshold >= 0 && threshold.thresholdDays > 0,
        txVelocity: threshold =>
          threshold.threshold > 0 && threshold.thresholdDays > 0,
        consecutiveDays: threshold => threshold.thresholdDays > 0
      }
  
      if (triggerType && thresholdValidator[triggerType](threshold)) return
  
      return context.createError({
        path: 'threshold',
        message: errorMessages[triggerType](threshold)
      })
  }),
  REQUIREMENT: Yup.object()
    .shape({
      requirement: Yup.object({
        requirement: Yup.string().required(),
        suspensionDays: Yup.number().when('requirement', {
          is: value => value === 'suspend',
          then: Yup.number()
            .nullable()
            .transform(transformNumber),
          otherwise: Yup.number()
            .nullable()
            .transform(() => null)
        }),
        customInfoRequestId: Yup.string().when('requirement', {
          is: value => value === 'custom',
          then: Yup.string(),
          otherwise: Yup.string()
            .nullable()
            .transform(() => '')
        })
      }).required()
    })
    .test(({ requirement }, context) => {
      const requirementValidator = (requirement, type) => {
        switch (type) {
          case 'suspend':
            return requirement.requirement === type
              ? requirement.suspensionDays > 0
              : true
          case 'custom':
            return requirement.requirement === type
              ? !R.isNil(requirement.customInfoRequestId)
              : true
          default:
            return true
        }
      }
  
      if (requirement && !requirementValidator(requirement, 'suspend'))
        return context.createError({
          path: 'requirement',
          message: 'Suspension days must be greater than 0'
        })
  
      if (requirement && !requirementValidator(requirement, 'custom'))
        return context.createError({
          path: 'requirement',
          message: 'You must select an item'
        })
  }),
  ADVANCED_SETTINGS: Yup.object().shape({
    expirationTime: Yup.string()
      .label('Expiration time')
      .required(),
    automation: Yup.string()
      .label('Automation')
      .matches(/(Manual|Automatic)/)
      .required()
  }),
  ADVANCED_SETTINGS_OVERRIDES: (values, customInfoRequests) =>
    Yup.object().shape({
      id: Yup.string()
        .label('Requirement')
        .required()
        .test({
          test() {
            const { requirement } = this.parent
            if (R.find(R.propEq('requirement', requirement))(values)) {
              return this.createError({
                message: `Requirement ${displayRequirement(
                  requirement,
                  customInfoRequests
                )} already overriden`
              })
            }
            return true
          }
        }),
      expirationTime: Yup.string()
        .label('Expiration time')
        .required(),
      automation: Yup.string()
        .label('Automation')
        .matches(/(Manual|Automatic)/)
        .required()
  }),
  CUSTOM_INFO_REQUESTS: {
    CHOOSE_TYPE: Yup.object().shape({
      inputType: Yup.string().required()
    }),
    REQUIREMENT_NAME: existingRequirements => Yup.object().shape({
      requirementName: Yup.string()
        .required('A requirement name is required')
        .test(
          'unique-name',
          'A custom information requirement with that name already exists',
          (value, _context) =>
            !R.any(
              it => R.equals(R.toLower(it), R.toLower(value)),
              R.map(it => it.customRequest.name, existingRequirements)
            )
        )
    }),
    SCREEN1: Yup.object().shape({
      screen1Title: Yup.string().required(),
      screen1Text: Yup.string().required()
    }),
    SCREEN2: Yup.object().shape({
      screen2Title: Yup.string().required(),
      screen2Text: Yup.string().required()
    }),
    TYPES: Yup.lazy(values => {
      switch (values.inputType) {
        case 'numerical':
          return Yup.object({
            constraintType: Yup.string().required(),
            inputLength: Yup.number().when('constraintType', {
              is: 'length',
              then: Yup.number()
                .min(0)
                .required(),
              else: Yup.mixed().notRequired()
            })
          })
        case 'text':
          return Yup.object({
            constraintType: Yup.string().required(),
            inputLabel1: Yup.string().required(),
            inputLabel2: Yup.string().when('constraintType', {
              is: 'spaceSeparation',
              then: Yup.string().required(),
              else: Yup.mixed().notRequired()
            })
          })
        case 'choiceList':
          return Yup.object({
            constraintType: Yup.string().required(),
            listChoices: Yup.array().test(
              'has-2-or-more',
              'Choice list needs to have two or more non empty fields',
              (values, ctx) => {
                return R.filter(nonEmptyStr)(values).length > 1
              }
            )
          })
        default:
          return Yup.mixed().notRequired()
      }
    })
  }
}



const SCHEMAS = {
  WALLET,
  OPERATOR_INFO,
  ADD_MACHINE,
  AUTHENTICATION,
  BLACKLIST_MODAL,
  CASHOUT,
  COMMISSIONS,
  CUSTOMERS,
  LOCALES,
  LOYALTY,
  MACHINES,
  MAINTENANCE,
  NOTIFICATIONS,
  SERVICES,
  USER_MANAGEMENT,
  TRIGGERS
}

module.exports = { SCHEMAS }
