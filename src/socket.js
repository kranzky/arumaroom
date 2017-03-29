import * as io from 'socket.io-client'

const RATE = 2

class Socket {
  constructor (url, debug) {
    this.debug = debug
    this.cooldown = 0
    this.payload = {}
    if (url) {
      this.io = io(url, { secure: true })
      this.io.on('connect', () => {
        if (this.debug) {
          console.debug('[socket] connected to', url)
        }
      })
    }
  }

  // buffer up all of the sends
  send (event, data) {
    this.payload[event] = data
  }

  // only process the buffered data twice a second
  update (dt) {
    this.cooldown -= dt
    if (this.cooldown < 0) {
      this.cooldown = 1 / RATE
      // for (var event in this.payload) {
      //   this.process(event, this.payload[event])
      // }
      this.payload = {}
    }
  }

  process (event, data) {
    if (this.io) {
      this.io.emit(event, data)
    }
    if (this.debug) {
     // console.debug('[socket]', event, data)
    }
  }
}

export default Socket
