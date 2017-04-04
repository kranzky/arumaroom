/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

import Leap from 'leapjs'

import Socket from './socket'
import Camera from './camera.js'
import Jockey from './jockey.js'
import Gamepad from './gamepad.js'

import Hand from './entities/hand.js'
import Stars from './entities/stars.js'
import Planet from './entities/planet.js'

const WIDTH = 1200
const HEIGHT = 675
const FOV = 60

const RATIO = WIDTH / HEIGHT

const FPS = 50
const URL = null // 'https://leap.dev:3001'

const ROOMS = {
  chill: {
    texture: 'green_planet',
    radius: 1000,
    tracks: [
      'bensound-acousticbreeze',
      'bensound-cute',
      'bensound-happiness'
    ]
  },
  party: {
    texture: 'red_planet',
    radius: 500,
    tracks: [
      'bensound-dubstep',
      'bensound-moose'
    ]
  },
  groove: {
    texture: 'blue_planet',
    radius: 800,
    tracks: [
      'bensound-funkysuspense'
    ]
  },
  rock: {
    texture: 'purple_planet',
    radius: 300,
    tracks: [
      'bensound-goinghigher'
    ]
  },
  world: {
    colour: 'yellow',
    radius: 2000,
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

  nextRoom () {
    let rooms = Object.keys(ROOMS)
    let index = rooms.indexOf(this.room) + 1
    if (index >= rooms.length) {
      index = 0
    }
    this.setRoom(rooms[index])
  }

  prevRoom () {
    let rooms = Object.keys(ROOMS)
    let index = rooms.indexOf(this.room) - 1
    if (index < 0) {
      index = rooms.length - 1
    }
    this.setRoom(rooms[index])
  }

  init (data) {
    this.data = data
    this.socket = new Socket(URL, this.data.debug)
    this.camera = new Camera(WIDTH, HEIGHT, FOV)
    this.jockey = new Jockey()
    this.gamepad = new Gamepad()
    this.engine = new PIXI.Application(WIDTH, HEIGHT, {
      view: this.canvas,
      antialias: true
    })
    this.world = new PIXI.Container()
    this.engine.stage.addChild(this.world)
    this.size()
    this.ready = true
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
      for (name in PIXI.loader.resources) {
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
    if (!this.ready) {
      return
    }
    frame.hands.forEach(hand => {
      if (hand.valid && hand.confidence > 0.2) {
        let entity = this.entities[hand.type]
        entity.leap(hand, frame.gestures)
      }
    })
  }

  loop (ms) {
    this.gamepad.scan()
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
    if (!this.ready) {
      return
    }

    this.socket.update(dt)

    for (var id in this.entities) {
      this.entities[id].update(dt, this.camera, this.data.debug)
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
    // move left stick to rotate camera
    if (this.gamepad.mode === 'move' && Math.abs(this.gamepad.stick.left[0]) > 0.01) {
      this.camera.spin = this.gamepad.stick.left[0]
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
    // move left stick to zoom camera
    if (this.gamepad.mode === 'move' && Math.abs(this.gamepad.stick.left[1]) > 0.01) {
      this.camera.zoom = -this.gamepad.stick.left[1]
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
    // move right stick to pan around
    if (this.gamepad.mode === 'move') {
      if (Math.abs(this.gamepad.stick.right[0]) > 0.01) {
        this.camera.pan = this.gamepad.stick.right[0]
      }
      if (Math.abs(this.gamepad.stick.right[1]) > 0.01) {
        this.camera.tilt = -this.gamepad.stick.right[1]
      }
    } else {
      if (this.gamepad.pressed.buttons.x) {
        left.alive = true
        if (left.grab > 0.5) {
          left.grab = 0
          left.pinch = 1
        } else if (left.pinch > 0.5) {
          left.grab = 0
          left.pinch = 0
        } else {
          left.grab = 1
          left.pinch = 0
        }
      }
      if (Math.abs(this.gamepad.stick.left[0]) > 0.01) {
        left.alive = true
        left.position[0] += this.gamepad.stick.left[0] * 300 * dt
      }
      if (Math.abs(this.gamepad.stick.left[1]) > 0.01) {
        left.alive = true
        left.position[2] += this.gamepad.stick.left[1] * 300 * dt
      }
      if (this.gamepad.pressed.buttons.b) {
        right.alive = true
        if (right.grab > 0.5) {
          right.grab = 0
          right.pinch = 1
        } else if (right.pinch > 0.5) {
          right.grab = 0
          right.pinch = 0
        } else {
          right.grab = 1
          right.pinch = 0
        }
      }
      if (Math.abs(this.gamepad.stick.right[0]) > 0.01) {
        right.alive = true
        right.position[0] += this.gamepad.stick.right[0] * 300 * dt
      }
      if (Math.abs(this.gamepad.stick.right[1]) > 0.01) {
        right.alive = true
        right.position[2] += this.gamepad.stick.right[1] * 300 * dt
      }
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

    if (this.gamepad.pressed.buttons.a) {
      if (this.gamepad.mode === 'move') {
        this.gamepad.mode = 'wave'
      } else {
        this.gamepad.mode = 'move'
      }
    }

    if (this.gamepad.pressed.shoulder.left) {
      this.prevRoom()
    }
    if (this.gamepad.pressed.shoulder.right) {
      this.nextRoom()
    }

    if (this.gamepad.pressed.back) {
      this.data.debug = !this.data.debug
    }
    if (this.gamepad.pressed.start) {
      location.reload()
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
    this.data.pad.sticks.left = [this.gamepad.stick.left[0], this.gamepad.stick.left[1]]
    this.data.pad.sticks.right = [this.gamepad.stick.right[0], this.gamepad.stick.right[1]]
    this.data.pad.triggers.left = this.gamepad.trigger.left
    this.data.pad.triggers.right = this.gamepad.trigger.right
    let buttons = []
    if (this.gamepad.buttons.a) { buttons.push('a') }
    if (this.gamepad.buttons.b) { buttons.push('b') }
    if (this.gamepad.buttons.x) { buttons.push('x') }
    if (this.gamepad.buttons.y) { buttons.push('y') }
    if (this.gamepad.back) { buttons.push('back') }
    if (this.gamepad.start) { buttons.push('start') }
    if (this.gamepad.dpad.up) { buttons.push('up') }
    if (this.gamepad.dpad.down) { buttons.push('down') }
    if (this.gamepad.dpad.left) { buttons.push('left') }
    if (this.gamepad.dpad.right) { buttons.push('right') }
    if (this.gamepad.shoulder.left) { buttons.push('lb') }
    if (this.gamepad.shoulder.right) { buttons.push('rb') }
    this.data.pad.buttons = buttons
  }

  fini () {
    this.ready = false
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
    for (var room in ROOMS) {
      let name = ROOMS[room].texture
      let radius = ROOMS[room].radius
      this.entities[room] = new Planet(this.textures[name], radius)
      this.entities[room].add(this.world)
    }
    this.entities['right'] = new Hand(this.textures, false)
    this.entities['right'].add(this.world)
    this.entities['left'] = new Hand(this.textures, true)
    this.entities['left'].add(this.world)
  }
}

export default Room
