/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

import Leap from 'leapjs'

import Hand from 'entities/hand.js'
import Camera from 'entities/camera.js'
import Jockey from 'entities/jockey.js'
import Stars from 'entities/stars.js'

import Socket from './socket'

const WIDTH = 1200
const HEIGHT = 675
const RATIO = WIDTH / HEIGHT
const FPS = 50
const URL = null // 'https://leap.dev:3001'

// TODO
// * 2.5d starfield for correct planet rotation and zoom
//   + spawn planets in the distance, always be zooming in
// * better hand controls
//   + keep the spin controls (open hands)
//   + make fists to pan and zoom (like superman)
//   + pan starfield too (while velocity, then re-centre)
// * change particle colour based on gesture
//   + only show hands in debug mode
// * grab and pinch to change filter (slowly reverts to normal)
// * xbox controls
// * some kind of full-screen effect driven by music
// * dust particles when moving around
// * reset hands to home position when no leap controller

// https://phaser.io/examples/v2/demoscene/ballfield
// https://phaser.io/examples/v2/demoscene/defjam-path-follow
// https://phaser.io/examples/v2/demoscene/starfield-batched
// https://phaser.io/examples/v2/category/filters
// https://phaser.io/examples/v2/filters/mouse-ray
// https://phaser.io/examples/v2/filters/rainbow-bars

// camera stays fixed at origin
// we translate and rotate all the objects
// all objects have a point in 3d space; we re-spawn them if they go outside some bounds
// all objects also have a radius; we project onto the screen and calculate width and height

const ROOMS = {
  chill: {
    texture: 'green_planet',
    tracks: [
      'bensound-acousticbreeze',
      'bensound-cute',
      'bensound-happiness'
    ]
  },
  party: {
    texture: 'red_planet',
    tracks: [
      'bensound-dubstep',
      'bensound-moose'
    ]
  },
  groove: {
    texture: 'blue_planet',
    tracks: [
      'bensound-funkysuspense'
    ]
  },
  rock: {
    texture: 'purple_planet',
    tracks: [
      'bensound-goinghigher'
    ]
  },
  world: {
    colour: 'yellow',
    texture: 'yellow_planet',
    tracks: [
      'bensound-littleplanet'
    ]
  }
}

const TEXTURES = [
  'open',
  'closed',
  'point',
  'pinch',
  'stars',
  'particle'
]

class Room {
  constructor (elementId) {
    window.room = this
    this.rooms = Object.keys(ROOMS).map((name) => {
      return {
        label: name,
        value: name
      }
    })
    this.room = null
    this.game_time = 0
    this.seconds_per_frame = 1.0 / FPS
    this.canvas = document.getElementById(elementId)
    this.textures = {}
    this.entities = {}
    this.values = {}
    this.data = null
  }

  setRoom (room) {
    this.room = room
    this.jockey.play(ROOMS[room].tracks)
  }

  init (data) {
    this.data = data
    this.socket = new Socket(URL, this.data.debug)
    this.camera = new Camera()
    this.jockey = new Jockey()
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
    for (var room in ROOMS) {
      let name = ROOMS[room].texture
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
    this.spawnEntities()
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
      this.entities[id].update(dt, this.camera)
    }

    this.control(dt)

    this.camera.update(dt)
    this.jockey.update(dt)

    if (this.data.debug) {
      this.debug(dt)
    }

    this.socket.send('room', this.room)
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

    // update stars based on camera
    // update planets based on camera
  }

  debug (dt) {
    ['left', 'right'].forEach(id => {
      this.data.hands[id].position = this.entities[id].position
      this.data.hands[id].rotation = this.entities[id].rotation
      this.data.hands[id].pinch = this.entities[id].pinch
      this.data.hands[id].grab = this.entities[id].grab
      this.data.hands[id].gesture = this.entities[id].gesture
    })
    this.data.rooms = this.rooms
    this.data.name = this.room
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
  }

  fini () {
    for (var id in this.entities) {
      let entity = this.entities[id]
      if (entity) {
        entity.remove(this.world)
      }
      delete this.entities[id]
    }
    for (var name of TEXTURES) {
      let texture = this.textures[name]
      if (texture) {
        texture.destroy(true)
      }
      delete this.textures[name]
    }
    for (var room in ROOMS) {
      let name = ROOMS[room].texture
      let texture = this.textures[name]
      if (texture) {
        texture.destroy(true)
      }
      delete this.textures[name]
    }
    this.jockey.fini()
    PIXI.loader.reset()
    this.world.destroy()
    this.engine.destroy()
    window.room = undefined
  }

  spawnEntities () {
    this.entities['stars'] = new Stars(this.textures['stars'])
    this.entities['stars'].add(this.world)
    this.entities['right'] = new Hand(this.textures, false)
    this.entities['right'].add(this.world)
    this.entities['left'] = new Hand(this.textures, true)
    this.entities['left'].add(this.world)
  }
}

export default Room
