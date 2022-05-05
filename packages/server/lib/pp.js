module.exports = function (label) {
  return function (o) {
    console.log(label)
    console.log(require('util').inspect(o, {depth: null, colors: true}))
    return o
  }
}
