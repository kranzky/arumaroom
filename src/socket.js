import * as io from 'socket.io-client'
import { Howl } from 'howler'

class Socket {
  constructor (config, debug) {
    this.config = config
    this.debug = debug
    this.cooldown = 0
    this.payload = {}
    this.sound = new Howl({
      src: `statics/ding.webm`
    })
    if (this.config.connect) {
      this.io = io(this.config.url, { secure: true })
      this.io.on('connect', () => {
        if (this.debug) {
          console.debug('[socket] connected to', this.config.url)
        }
      })
      this.io.on('videos:created', (data) => {
        console.debug('video has been created')
        var video = data.video
        window.room.data.videos.unshift(video)
        window.room.tv()
      })
      this.io.on('phones:created', (data) => {
        console.debug('phone has been created')
        var phone = data.phone
        this.sound.play()
        window.room.phone(phone.name + ' entered room. #' + phone.id)
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
