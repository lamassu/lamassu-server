import _ from 'lodash/fp'

const transformNumber = value =>
  _.isNumber(value) && !_.isNaN(value) ? value : null

export { transformNumber }
