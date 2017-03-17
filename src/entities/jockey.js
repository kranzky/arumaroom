class Jockey {
  constructor (music, socket) {
    this.socket = socket
    this.music = music
    this.track = null
    this.volume = 500
    this.filter = null
    this.frequency = 10000
    this.quality = 0
  }

  setTrack (name) {
  }

  nextTrack () {
  }

  prevTrack () {
  }

  update (dt) {
    if (this.volume < 0) {
      this.volume = 0
    } else if (this.volume > 1000) {
      this.volume = 1000
    }
    this.socket.send('volume', this.volume / 1000)
  }
}

export default Jockey
