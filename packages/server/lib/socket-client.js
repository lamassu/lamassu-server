const io = require('socket.io-client')

const socket = io('http://localhost:3060')

module.exports = {emit}

function emit (msg) {
  socket.emit('message', msg)
}
