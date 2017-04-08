/* global PIXI */
import 'pixi.js'
import 'pixi-display'

import Leap from 'leapjs'

import Socket from './socket'
import Camera from './camera.js'
import Jockey from './jockey.js'
import Gamepad from './gamepad.js'

import Hand from './entities/hand.js'
import Stars from './entities/stars.js'
import Planet from './entities/planet.js'
import Dust from './entities/dust.js'
import Caption from './entities/caption.js'

const HAND = [
  'open',
  'closed',
  'point',
  'pinch'
]

class Room {
  constructor (elementId) {
    window.room = this
    this.config = require('assets/config.json')
    this.ratio = this.config.screen.width / this.config.screen.height
    this.rooms = Object.keys(this.config.rooms).map((name) => {
      return {
        label: name,
        value: name
      }
    })
    this.room = null
    this.game_time = 0
    this.seconds_per_frame = 1.0 / this.config.screen.fps
    this.canvas = document.getElementById(elementId)
    this.textures = {}
    this.entities = {}
    this.values = {}
    this.data = null
  }

  setRoom (room) {
    this.room = room
    this.jockey.setTracks(this.config.rooms[room].tracks)
  }

  nextRoom () {
    let rooms = Object.keys(this.config.rooms)
    let index = rooms.indexOf(this.room) + 1
    if (index >= rooms.length) {
      index = 0
    }
    this.setRoom(rooms[index])
  }

  prevRoom () {
    let rooms = Object.keys(this.config.rooms)
    let index = rooms.indexOf(this.room) - 1
    if (index < 0) {
      index = rooms.length - 1
    }
    this.setRoom(rooms[index])
  }

  init (data) {
    this.data = data
    this.socket = new Socket(this.config.socket, this.data.debug)
    this.camera = new Camera(this.config.screen, this.data.debug)
    this.jockey = new Jockey(this.config.music, this.data.debug)
    this.gamepad = new Gamepad()
    this.engine = new PIXI.Application(this.config.screen.width, this.config.screen.height, {
      view: this.canvas,
      antialias: true
    })
    this.world = new PIXI.Container()
    this.engine.stage.addChild(this.world)
    this.engine.stage.displayList = new PIXI.DisplayList()
    this.space = new PIXI.DisplayGroup(0, true)
    this.size()
    this.ready = true
  }

  load (callback) {
    for (var pose of HAND) {
      PIXI.loader.add(pose, require(`assets/${pose}.png`))
    }
    for (var name in this.config.textures) {
      let file = this.config.textures[name]
      PIXI.loader.add(name, require(`assets/${file}.png`))
    }
    for (var room in this.config.rooms) {
      let name = this.config.rooms[room].texture
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
    if (ratio < this.ratio) {
      this.world.scale.y = ratio / this.ratio
    }
    if (ratio > this.ratio) {
      this.world.scale.x = this.ratio / ratio
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
    if (!this.ready) {
      return
    }
    this.gamepad.scan()
    if (!this.game_time && ms > 0) {
      this.game_time = ms / 1000
    }
    let dt = ms / 1000 - this.game_time
    if (dt > 1) {
      this.game_time += dt
      dt = 0
    }
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
      if (this.entities[id].collided) {
        this.entities[id].collided = false
        this.setRoom(this.entities[id].name)
        this.jockey.randomTrack()
      }
    }

    this.control(dt)

    this.camera.update(dt)
    this.jockey.update(dt)

    if (this.game_time <= 3 && this.game_time + dt > 3) {
      this.entities['caption'].setMessage('Aruma Room')
    }
    if (this.jockey.changed) {
      this.jockey.changed = false
      this.entities['caption'].setMessage(this.jockey.track)
    }

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
      this.camera.spin = -this.gamepad.stick.left[0]
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
        this.camera.pan = -this.gamepad.stick.right[0]
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
    for (var pose of HAND) {
      let texture = this.textures[pose]
      if (texture) {
        texture.destroy(true)
      }
      delete this.textures[pose]
    }
    for (var name in this.config.textures) {
      let texture = this.textures[name]
      if (texture) {
        texture.destroy(true)
      }
      delete this.textures[name]
    }
    for (var room in this.config.rooms) {
      let name = this.config.rooms[room].texture
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
    this.entities['stars'] = new Stars(this.textures['background'])
    this.entities['stars'].add(this.world)
    for (var room in this.config.rooms) {
      let name = this.config.rooms[room].texture
      let radius = this.config.rooms[room].radius
      this.entities[room] = new Planet(room, this.textures[name], radius, this.config.planet, this.data.debug)
      this.entities[room].add(this.world, this.space)
    }
    for (var i = 0; i < this.config.dust.num; ++i) {
      this.entities['dust' + i] = new Dust(this.textures['particle'], this.config.dust, this.data.debug)
      this.entities['dust' + i].add(this.world, this.space)
    }
    let handTextures = HAND.map(name => this.textures[name])
    this.entities['right'] = new Hand(handTextures, this.textures['particle'], false)
    this.entities['right'].add(this.world, this.space)
    this.entities['left'] = new Hand(handTextures, this.textures['particle'], true)
    this.entities['left'].add(this.world, this.space)
    this.entities['caption'] = new Caption(this.config.captions, this.data.debug)
    this.entities['caption'].add(this.world, this.space)
  }
}

export default Room
