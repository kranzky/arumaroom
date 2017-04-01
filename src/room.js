/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

import Leap from 'leapjs'

import Hand from 'entities/hand.js'
import Camera from 'entities/camera.js'
import Jockey from 'entities/jockey.js'
import Lights from 'entities/lights.js'
import Video from 'entities/video.js'

import Socket from './socket'

const WIDTH = 1200
const HEIGHT = 675
const RATIO = WIDTH / HEIGHT
const FPS = 50

const TEXTURES = [
  'open',
  'closed',
  'point',
  'pinch',
  'stars',
  'planet',
  'moon',
  'particle'
]

class Room {
  constructor (elementId) {
    window.room = this
    this.game_time = 0
    this.seconds_per_frame = 1.0 / FPS
    this.canvas = document.getElementById(elementId)
    this.textures = {}
    this.entities = {}
    this.values = {}
    this.data = null
  }

  init (data) {
    let URL = 'https://aruma.cervenka.space/socket.io'
    let API = 'https://aruma.cervenka.space'

    if (PROD) {
      URL = 'https://aruma.dev:6001'
      API = 'https://leapapi.dev'
    }
    this.data = data
    this.socket = new Socket(URL, this.data.debug)
    this.camera = new Camera(this.socket)
    this.jockey = new Jockey(this.socket)
    this.lights = new Lights(this.socket)
    this.video = new Video(this.socket, API)
    this.engine = new PIXI.Application(WIDTH, HEIGHT, {
      view: this.canvas,
      antialias: true
    })
    this.world = new PIXI.Container()
    this.engine.stage.addChild(this.world)
    this.size()
  }

  load (callback) {
    this.jockey.load()
    for (var name of TEXTURES) {
      PIXI.loader.add(name, require(`assets/${name}.png`))
    }
    PIXI.loader.once('complete', () => {
      for (name of TEXTURES) {
        this.textures[name] = PIXI.loader.resources[name].texture
      }
      callback()
    })
    PIXI.loader.load()
  }

  run () {
    this.stars = new PIXI.Sprite(this.textures['stars'])
    this.stars.anchor.x = 0.5
    this.stars.anchor.y = 0.5
    this.stars.scale.x = 5
    this.stars.scale.y = 5
    this.world.addChild(this.stars)
    this.planet = new PIXI.Sprite(this.textures['planet'])
    this.planet.anchor.x = 0.5
    this.planet.anchor.y = 0.5
    this.world.addChild(this.planet)
    this.spawnHand('left', 'left')
    this.spawnHand('right', 'right')
    Leap.loop({
      background: true,
      frameEventName: 'deviceFrame',
      loopWhileDisconnected: false
    }, (frame) => this.leap(frame))
    this.loop()
  }

  size () {
    this.world.position.x = this.engine.renderer.width / 2
    this.world.position.y = this.engine.renderer.height / 2
    let ratio = this.canvas.scrollWidth / this.canvas.scrollHeight
    if (ratio < RATIO) {
      this.world.scale.y = ratio / RATIO
    }
    if (ratio > RATIO) {
      this.world.scale.x = RATIO / ratio
    }
  }

  leap (frame) {
    frame.hands.forEach(hand => {
      if (hand.valid && hand.confidence > 0.2) {
        let entity = this.entities[hand.type]
        entity.leap(hand, frame.gestures)
      }
    })
  }

  loop (ms) {
    if (!this.game_time && ms > 0) {
      this.game_time = ms / 1000
    }
    let dt = ms / 1000 - this.game_time
    while (dt > this.seconds_per_frame) {
      this.game_time += this.seconds_per_frame
      dt -= this.seconds_per_frame
      this.update(this.seconds_per_frame)
    }
    requestAnimationFrame(this.loop.bind(this))
  }

  update (dt) {
    this.socket.update(dt)

    for (var id in this.entities) {
      this.entities[id].update(dt)
    }

    this.control(dt)

    this.camera.update(dt)
    this.lights.update(dt)
    this.jockey.update(dt)

    this.stars.rotation = this.camera.angle
    this.planet.rotation = this.camera.angle
    this.planet.scale.x = this.camera.scale
    this.planet.scale.y = this.camera.scale
    this.planet.position.x = this.camera.position[0]
    this.planet.position.y = this.camera.position[1]

    if (this.data.debug) {
      this.debug(dt)
    }
  }

  control (dt) {
    let left = this.entities.left
    let right = this.entities.right

    // open hands and tilt in opposite directions to rotate camera
    if (!left.pose && !right.pose) {
      let spin = (left.rotation[0] - right.rotation[0])
      spin *= Math.abs(spin)
      spin *= Math.abs(spin)
      spin /= 30
      if (Math.abs(spin) > 0.0003) {
        this.camera.spin = spin
      }
    }

    // pinch with both hands to zoom in and out
    if (left.pose === 'pinch' && right.pose === 'pinch') {
      let distance = (left.position[0] - right.position[0])
      if (this.values.zoom) {
        this.camera.zoom = this.values.zoom - distance
        this.camera.zoom /= 100
        this.camera.zoom *= Math.abs(this.camera.zoom)
      } else {
        this.values.zoom = distance
      }
    } else {
      this.values.zoom = null
    }

    // grab with both hands to pan around
    if (left.pose === 'grab' && right.pose === 'grab') {
      let position = 0.5 * (left.position[0] + right.position[0])
      if (this.values.pan) {
        this.camera.pan = position - this.values.pan
        this.camera.pan /= 100
        this.camera.pan *= Math.abs(this.camera.pan)
      } else {
        this.values.pan = position
      }
      position = 0.5 * (left.position[2] + right.position[2])
      if (this.values.tilt) {
        this.camera.tilt = position - this.values.tilt
        this.camera.tilt /= 100
        this.camera.tilt *= Math.abs(this.camera.tilt)
      } else {
        this.values.tilt = position
      }
    } else {
      this.values.pan = null
      this.values.tilt = null
    }

    // grab with left hand and pinch with right hand to change volume,
    // frequency and quality
    if (left.pose === 'grab' && right.pose === 'pinch') {
      let height = right.position[1]
      let width = right.position[0]
      let depth = right.position[2]
      if (this.values.height) {
        let diff = height - this.values.height
        diff /= 100
        this.jockey.volume = this.values.volume + diff
      } else {
        this.values.volume = this.jockey.volume
        this.values.height = height
      }
      if (this.values.width) {
        let diff = width - this.values.width
        diff *= 100
        this.jockey.frequency = this.values.frequency + diff
      } else {
        this.values.frequency = this.jockey.frequency
        this.values.width = width
      }
      if (this.values.depth) {
        let diff = depth - this.values.depth
        diff /= 10
        this.jockey.quality = this.values.quality + diff
      } else {
        this.values.quality = this.jockey.quality
        this.values.depth = depth
      }
    } else {
      this.values.volume = null
      this.values.frequency = null
      this.values.quality = null
      this.values.height = null
      this.values.width = null
      this.values.depth = null
    }

    // grab with left hand and circle with right hand to change track, or
    // tap with right hand to change filter
    if (left.pose === 'grab' && !right.pose) {
      if (right.gesture === 'circle') {
        this.jockey.nextTrack()
        right.gesture = null
      }
      if (right.gesture === 'tap') {
        this.jockey.nextFilter()
        right.gesture = null
      }
    }

    // grab with right hand and circle with left hand to change colour, or
    // tap with left hand to change pattern
    if (right.pose === 'grab' && !left.pose) {
      if (left.gesture === 'circle') {
        this.lights.nextColour()
        left.gesture = null
      }
      if (left.gesture === 'tap') {
        this.lights.nextPattern()
        left.gesture = null
      }
    }
  }

  debug (dt) {
    ['left', 'right'].forEach(id => {
      this.data.hands[id].position = this.entities[id].position
      this.data.hands[id].rotation = this.entities[id].rotation
      this.data.hands[id].pinch = this.entities[id].pinch
      this.data.hands[id].grab = this.entities[id].grab
      this.data.hands[id].gesture = this.entities[id].gesture
    })
    this.data.camera.pan = this.camera.pan * 500
    this.data.camera.tilt = this.camera.tilt * 500
    this.data.camera.spin = this.camera.spin * 500
    this.data.camera.zoom = this.camera.zoom * 500
    this.data.music.tracks = this.jockey.tracks
    this.data.music.track = this.jockey.track
    this.data.music.volume = this.jockey.volume * 1000
    this.data.music.filters = this.jockey.filters
    this.data.music.filter = this.jockey.filter
    this.data.music.frequency = this.jockey.frequency
    this.data.music.quality = this.jockey.quality
    this.data.lights.patterns = this.lights.patterns
    this.data.lights.pattern = this.lights.pattern
    this.data.lights.colours = this.lights.colours
    this.data.lights.colour = this.lights.colour
  }

  fini () {
    for (var id in this.entities) {
      this.entities[id].remove(this.world)
      delete this.entities[id]
    }
    for (var name of TEXTURES) {
      this.textures[name].destroy(true)
      delete this.textures[name]
    }
    this.jockey.fini()
    PIXI.loader.reset()
    this.world.destroy()
    this.engine.destroy()
    window.room = undefined
  }

  spawnHand (id, type) {
    this.entities[id] = new Hand(this.textures, type === 'left')
    this.entities[id].add(this.world)
    return this.entities[id]
  }
}

export default Room
