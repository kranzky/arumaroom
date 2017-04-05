import { Howler, Howl } from 'howler'

const FILTERS = [
  'lowpass',
  'highpass',
  'bandpass',
  'lowshelf',
  'highshelf',
  'peaking',
  'notch',
  'allpass'
]
const FADE = 2000

class Jockey {
  constructor () {
    this.music = {}
    this.setlist = []
    this.tracks = []
    this.filters = FILTERS.map((name) => {
      return {
        label: name,
        value: name
      }
    })
    this.track = null
    this.volume = 1
    this.filter = null
    this.frequency = 10000
    this.quality = 0
    this.playing = null
    this.changing = false
    this.changed = false
  }

  setTracks (tracks) {
    this.setlist = tracks
    this.tracks = tracks.map((name) => {
      return {
        label: name,
        value: name
      }
    })
  }

  fini () {
    Howler.unload()
  }

  nextTrack () {
    let index = this.setlist.indexOf(this.track) + 1
    if (index >= this.setlist.length) {
      index = 0
    }
    this.setTrack(this.setlist[index])
  }

  prevTrack () {
    let index = this.setlist.indexOf(this.track) - 1
    if (index < 0) {
      index = this.setlist.length - 1
    }
    this.setTrack(this.setlist[index])
  }

  randomTrack () {
    let index = Math.floor(Math.random() * this.setlist.length)
    this.setTrack(this.setlist[index])
  }

  setTrack (name) {
    if (name === this.track || this.changing) {
      return
    }
    this.changing = true
    this.music[name] = new Howl({
      src: [require(`assets/${name}.webm`), require(`assets/${name}.mp3`)],
      loop: true,
      html5: true
    })
    let track = name
    this.music[name].on('load', (id) => {
      this._loaded(track, id)
    })
    this.music[name].on('fade', (id) => {
      this._faded(track, id)
    })
  }

  nextFilter () {
    let index = FILTERS.indexOf(this.filter) + 1
    if (index >= FILTERS.length) {
      index = 0
    }
    this.setFilter(FILTERS[index])
  }

  prevFilter () {
    let index = FILTERS.indexOf(this.filter) - 1
    if (index < 0) {
      index = FILTERS.length - 1
    }
    this.setFilter(FILTERS[index])
  }

  setFilter (name) {
    this.filter = name
  }

  update (dt) {
    if (this.volume < 0) {
      this.volume = 0
    } else if (this.volume > 1) {
      this.volume = 1
    }
    if (this.frequency < 20) {
      this.frequency = 20
    } else if (this.frequency > 20000) {
      this.frequency = 20000
    }
    if (this.quality < 0) {
      this.quality = 0
    } else if (this.quality > 100) {
      this.quality = 100
    }
    Howler.volume(this.volume)
  }

  _loaded (name, id) {
    if (this.playing) {
      this.music[this.track].fade(1, 0, FADE, this.playing)
    }
    let offset = 0
    if (this.setlist.indexOf(this.track) >= 0) {
      offset = this.music[name].duration() * Math.random()
    }
    this.playing = this.music[name].play()
    if (offset > 0) {
      this.music[name].seek(offset, this.playing)
      this.music[name].fade(0, 1, FADE, this.playing)
    }
    this.track = name
    this.changed = true
    this.changing = false
  }

  _faded (name, id) {
    if (name !== this.track) {
      this.music[name].stop(id)
      this.music[name].unload()
      delete this.music[name]
    }
  }
}

export default Jockey
