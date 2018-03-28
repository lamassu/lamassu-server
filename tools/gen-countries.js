const fs = require('fs')
const _ = require('lodash/fp')

const rawCountries = require('../raw-countries.json')

const topCodes = ['US', 'GB', 'CA', 'AU']

const countries = rawCountries
  .map(r => ({code: r.cca2, display: r.name.common}))

const topCountries = topCodes.map(c => countries.find(_.matchesProperty('code', c)))
const final = _.uniqBy(_.get('code'), _.concat(topCountries, countries))

fs.writeFileSync('countries.json', JSON.stringify(final))
