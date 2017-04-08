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

class Jockey {
  constructor (config, debug) {
    this.config = config
    this.debug = debug
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
    this.trackName = null
    this.volume = 1
    this.filter = null
    this.frequency = 10000
    this.quality = 0
    this.playing = null
    this.changing = false
    this.changed = false
  }

  setTracks (tracks) {
    let index = 0
    this.setlist = tracks
    this.tracks = tracks.map((track) => {
      return {
        label: track.name,
        value: index++
      }
    })
  }

  fini () {
    Howler.unload()
  }

  nextTrack () {
    let index = this.track ? this.track + 1 : 0
    if (index >= this.setlist.length) {
      index = 0
    }
    this.setTrack(index)
  }

  prevTrack () {
    let index = this.track ? this.track - 1 : -1
    if (index < 0) {
      index = this.setlist.length - 1
    }
    this.setTrack(index)
  }

  randomTrack () {
    let index = Math.floor(Math.random() * this.setlist.length)
    this.setTrack(index)
  }

  setTrack (index) {
    let name = this.setlist[index].name
    if (name === this.trackName || this.changing) {
      return
    }
    this.changing = true
    this.music[name] = new Howl({ src: this.setlist[index].url, loop: true, html5: true })
    this.music[name].on('load', () => {
      this._loaded(name, index)
    })
    this.music[name].on('fade', (id) => {
      this._faded(name, id)
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

  _loaded (name, index) {
    let offset = 0
    if (this.playing) {
      console.debug('[music] fadeout', this.trackName)
      this.music[this.trackName].fade(1, 0, this.config.fade, this.playing)
      offset = this.music[name].duration() * Math.random()
    }
    if (offset > 0) {
      this.music[name].seek(offset)
      this.music[name].fade(0, 1, this.config.fade)
    }
    console.debug('[music] play', name)
    this.playing = this.music[name].play()
    this.track = index
    this.trackName = name
    this.changed = true
    this.changing = false
  }

  _faded (name, id) {
    if (name !== this.trackName && this.music[name]) {
      console.debug('[music] stop', name)
      this.music[name].stop(id)
      this.music[name].unload()
      delete this.music[name]
    }
  }
}

export default Jockey
