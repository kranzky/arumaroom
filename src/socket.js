import * as io from 'socket.io-client'

class Socket {
  constructor (config, debug) {
    this.config = config
    this.debug = debug
    this.cooldown = 0
    this.payload = {}
    if (this.config.connect) {
      this.io = io(this.config.url, { secure: true })
      this.io.on('connect', () => {
        if (this.debug) {
          console.debug('[socket] connected to', this.config.url)
        }
      })
    }
  }

  // buffer up all of the sends
  send (event, data) {
    if (data) {
      this.payload[event] = data
    }
  }

  // only process the buffered data twice a second
  update (dt) {
    this.cooldown -= dt
    if (this.cooldown < 0) {
      this.cooldown = 1 / this.config.rate
      for (var event in this.payload) {
        this.process(event, this.payload[event])
      }
      this.payload = {}
    }
  }

  process (event, data) {
    if (this.io) {
      this.io.emit(event, data)
    }
    if (this.debug) {
      console.debug('[socket]', event, data)
    }
  }
}

export default Socket
