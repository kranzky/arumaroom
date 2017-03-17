import { Howler, Howl } from 'howler'

const MUSIC = [
  'bensound-dubstep',
  'bensound-moose'
]
const FADE = 2000

class Jockey {
  constructor (socket) {
    this.music = {}
    this.tracks = MUSIC.map((name) => {
      return {
        label: name,
        value: name
      }
    })
    this.socket = socket
    this.track = null
    this.volume = 1
    this.filter = null
    this.frequency = 10000
    this.quality = 0
    this.id = null
  }

  load () {
    for (var name of MUSIC) {
      this.music[name] = new Howl({
        src: [require(`assets/${name}.webm`), require(`assets/${name}.mp3`)],
        loop: true
      })
      let track = name
      this.music[name].on('fade', (id) => {
        this.faded(track, id)
      })
    }
  }

  fini () {
    Howler.unload()
  }

  nextTrack () {
    let index = MUSIC.indexOf(this.track) + 1
    if (index >= MUSIC.length) {
      index = 0
    }
    this.setTrack(MUSIC[index])
  }

  prevTrack () {
    let index = MUSIC.indexOf(this.track) - 1
    if (index < 0) {
      index = MUSIC.length - 1
    }
    this.setTrack(MUSIC[index])
  }

  setTrack (name) {
    if (name === this.track) {
      return
    }
    let offset = 0
    if (this.id) {
      this.music[this.track].fade(1, 0, FADE, this.id)
      offset = this.music[name].duration() * Math.random()
    }
    this.id = this.music[name].play()
    if (offset > 0) {
      this.music[name].seek(offset, this.id)
      this.music[name].fade(0, 1, FADE, this.id)
    }
    this.track = name
  }

  update (dt) {
    if (this.volume < 0) {
      this.volume = 0
    } else if (this.volume > 1) {
      this.volume = 1
    }
    Howler.volume(this.volume)
    this.socket.send('volume', this.volume)
  }

  faded (name, id) {
    if (name !== this.track) {
      this.music[name].stop(id)
    }
  }
}

export default Jockey
