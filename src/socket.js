import * as io from 'socket.io-client'

class Socket {
  constructor () {
    this.io = io('https://leap.dev:3001', { secure: true })
    this.io.on('connect', () => {
      console.debug('connected to aruma socket server')
    })
  }

  send (event, data) {
    this.io.emit(event, data)
  }
}

export default Socket
