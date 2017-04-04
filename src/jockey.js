import { Howler, Howl } from 'howler'

const MUSIC = []
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
    this.id = null
  }

  play (tracks) {
    this.tracks = tracks.map((name) => {
      return {
        label: name,
        value: name
      }
    })
    // TODO
    // * select a random track
    // * loop to random next track when finished
    // * load trackes on demand, crossfade when loaded
    // * get filters working
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

  faded (name, id) {
    if (name !== this.track) {
      this.music[name].stop(id)
    }
  }
}

export default Jockey
