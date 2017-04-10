import { Howler, Howl } from 'howler'

class Jockey {
  constructor (config, debug) {
    this.config = config
    this.debug = debug
    this.music = {}
    this.setlist = []
    this.tracks = []
    this.track = null
    this.trackName = null
    this.volume = 1
    this.frequency = 0
    this.quality = 0.5
    this.playing = null
    this.changing = false
    this.changed = false
    Howler.volume(this.volume)
    this.effect = Howler.ctx.createBiquadFilter()
    this.effect.type = 'lowpass'
//  Howler.masterGain.disconnect(Howler.ctx.destination)
    Howler.masterGain.connect(this.effect)
    this.effect.connect(Howler.ctx.destination)
    // this.analyser = Howler.ctx.createAnalyser()
    // Howler.masterGain.connect(this.analyser)
    // this.analyser.connect(Howler.ctx.destination)
    // analyser.getByteTimeDomainData(dataArray)
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
    if (this.setlist.length === 0) {
      return
    }
    let index = (this.track || 0) + 1
    if (index >= this.setlist.length) {
      index = 0
    }
    this.setTrack(index)
  }

  prevTrack () {
    if (this.setlist.length === 0) {
      return
    }
    let index = (this.track || 0) - 1
    if (index < 0) {
      index = this.setlist.length - 1
    }
    this.setTrack(index)
  }

  randomTrack () {
    if (this.setlist.length === 0) {
      return
    }
    let index = Math.floor(Math.random() * this.setlist.length)
    this.setTrack(index)
  }

  setTrack (index) {
    let name = this.setlist[index].name
    if (name === this.trackName || this.changing) {
      return
    }
    this.changing = true
    console.debug('[music] loading', this.setlist[index].url)
    this.music[name] = new Howl({ src: this.setlist[index].url, loop: true })
    this.music[name].on('load', () => {
      this._loaded(name, index)
    })
    this.music[name].on('fade', (id) => {
      this._faded(name, id)
    })
  }

  update (dt) {
    if (this.volume < 0) {
      this.volume = 0
    } else if (this.volume > 1) {
      this.volume = 1
    }
    if (this.frequency < 0) {
      this.frequency = 0
    } else if (this.frequency > 1) {
      this.frequency = 1
    }
    if (this.quality < 0) {
      this.quality = 0
    } else if (this.quality > 1) {
      this.quality = 1
    }
    Howler.volume(this.volume)
    this._changeFrequency()
    this.effect.Q.value = this.quality * 30
  }

  _loaded (name, index) {
    let offset = 0
    if (this.playing) {
      console.debug('[music] fadeout', this.trackName)
      this.music[this.trackName].fade(1, 0, this.config.fade, this.playing)
      offset = this.music[name].duration() * Math.random()
    } else {
      this.changed = true
      this.changing = false
    }
    if (offset > 0) {
      this.music[name].seek(offset)
      this.music[name].fade(0, 1, this.config.fade)
    }
    console.debug('[music] play', name)
    this.playing = this.music[name].play()
    this.track = index
    this.trackName = name
    window.room.video.record()
  }

  _faded (name, id) {
    if (name !== this.trackName && this.music[name]) {
      console.debug('[music] stop', name)
      this.music[name].stop(id)
      this.music[name].unload()
      delete this.music[name]
      this.changed = true
      this.changing = false
    }
  }

  _changeFrequency () {
    let minValue = 40
    let maxValue = Howler.ctx.sampleRate / 2
    let numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2
    let multiplier = Math.pow(2, numberOfOctaves * (this.frequency - 1.0))
    this.effect.frequency.value = maxValue * multiplier
  }
}

export default Jockey
