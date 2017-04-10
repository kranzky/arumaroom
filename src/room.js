/* global PIXI */
import 'pixi.js'
import 'pixi-filters'
import 'pixi-display'

import Leap from 'leapjs'
import axios from 'axios'

import Socket from './socket'
import Camera from './camera.js'
import Jockey from './jockey.js'
import Gamepad from './gamepad.js'
import Autopilot from './autopilot.js'
import Video from './video.js'

import Hand from './entities/hand.js'
import Stars from './entities/stars.js'
import Planet from './entities/planet.js'
import Dust from './entities/dust.js'
import Caption from './entities/caption.js'
import Phone from './entities/phone.js'
import Television from './entities/television.js'

const HAND = [
  'open',
  'closed',
  'point',
  'pinch'
]

class Room {
  constructor (elementId) {
    window.room = this
    this.config = require('statics/config.json')
    this.config.rooms = require('statics/rooms.json')
    if (this.config.music.connect) {
      this._loadRemoteMusic(this.config.music.url)
    }
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
    this.magic = 0.5
    this.inactive = 0
  }

  phone (message) {
    this.entities['phone'].setMessage(message || "'Hello?'")
  }

  tv () {
    if (this.data.videos.length === 0) {
      return
    }
    let index = Math.floor(Math.random() * this.data.videos.length)
    let url = this.data.videos[index].url
    url = 'statics/43.mp4'
    console.debug('[video]', url)
    this.entities['tv'].playVideo(url)
  }

  setRoom (room) {
    this.room = room
    this.jockey.setTracks(this.config.rooms[room].tracks)
    this.jockey.randomTrack()
    this.socket.send('room', this.room)
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
    this.video = new Video(this.socket, this.config.video)
    this.gamepad = new Gamepad()
    this.autopilot = new Autopilot()
    this.engine = new PIXI.Application(this.config.screen.width, this.config.screen.height, { view: this.canvas })
    this.world = new PIXI.Container()
    this.bloom = new PIXI.filters.BloomFilter()
    this.shock = new PIXI.filters.TwistFilter()
    this.bloom.blur = 4
    this.shock.offset = this.camera.screenCentre
    this.shock.angle = 0
    this.shock.radius = 300
    this.engine.stage.addChild(this.world)
    this.world.displayList = new PIXI.DisplayList()
    this.space = new PIXI.DisplayGroup(0, true)
    this.engine.stage.filters = [this.bloom, this.shock]
    this.size()
    this.ready = true
  }

  load (callback) {
    for (var pose of HAND) {
      PIXI.loader.add(pose, `statics/${pose}.png`)
    }
    for (var name in this.config.textures) {
      let file = this.config.textures[name]
      PIXI.loader.add(name, `statics/${file}.png`)
    }
    for (var room in this.config.rooms) {
      let path = this.config.rooms[room].texture
      PIXI.loader.add(room, path)
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
        this.inactive = 0
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
      if (this.entities[id].collided && !this.autopilot.enabled) {
        this.entities[id].collided = false
        this.setRoom(this.entities[id].name)
        this.shock.radius = 300
        this.shock.angle = 5
      }
    }

    this.control(dt)

    this.camera.update(dt)
    this.jockey.update(dt)
    this.autopilot.update(dt)

    if (this.game_time <= 3 && this.game_time + dt > 3) {
      this.entities['caption'].setMessage('Aruma Room')
    }
    if (this.jockey.changed) {
      this.jockey.changed = false
      this.entities['caption'].setMessage(this.jockey.trackName)
    }

    if (this.room) {
      this.socket.send('magic', this.magic)
    }

    if (this.shock.angle > 0) {
      this.shock.angle -= this.shock.angle * dt
      this.shock.radius -= this.shock.radius * dt
    }

    if (this.data.debug) {
      this.debug(dt)
    }

    if (this.autopilot.enabled && this.inactive === 0) {
      this.autopilot.enabled = false
    }
    if (!this.autopilot.enabled && this.inactive > 300) {
      this.autopilot.enabled = true
      this.entities['caption'].setMessage('Attract Mode')
    }

    if (this.magic > 1) {
      this.magic = 1
    } else if (this.magic < 0) {
      this.magic = 0
    }

    this.inactive += dt
  }

  control (dt) {
    let left = this.entities.left
    let right = this.entities.right

    // open hands and tilt in opposite directions to rotate camera
    if (!left.pose && !right.pose) {
      let spin = (left.rotation[0] - right.rotation[0])
      spin *= Math.abs(spin)
      spin *= Math.abs(spin)
      spin /= 10
      if (Math.abs(spin) > 0.0003) {
        this.camera.spin = spin
      }
    }

    // grab with both hands to fly
    if (left.pose === 'grab' && right.pose === 'grab') {
      let position = 0.5 * (left.position[0] + right.position[0])
      if (this.values.pan) {
        this.camera.pan = this.values.pan - position
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
    // pinch with left hand to change magic
    if (left.pose === 'pinch') {
      let leftWidth = left.position[0]
      let leftDepth = left.position[2]
      if (this.values.leftWidth && this.values.leftDepth) {
        let diff = leftWidth - this.values.leftWidth + leftDepth - this.values.leftDepth
        this.magic = this.values.magic + diff / 100
      } else {
        this.values.magic = this.magic
        this.values.leftWidth = leftWidth
        this.values.leftDepth = leftDepth
      }
    } else {
      this.values.magic = null
      this.values.leftWidth = null
      this.values.leftDepth = null
    }
    // pinch with right hand to change audio filter
    if (right.pose === 'pinch') {
      let rightWidth = right.position[0]
      let rightDepth = right.position[2]
      if (this.values.rightWidth) {
        let diff = rightWidth - this.values.rightWidth
        this.jockey.frequency = this.values.frequency + diff / 100
      } else {
        this.values.frequency = this.jockey.frequency
        this.values.rightWidth = rightWidth
      }
      if (this.values.rightDepth) {
        let diff = this.values.rightDepth - rightDepth
        this.jockey.quality = this.values.quality + diff / 100
      } else {
        this.values.quality = this.jockey.quality
        this.values.rightDepth = rightDepth
      }
    } else {
      this.values.frequency = null
      this.values.quality = null
      this.values.rightWidth = null
      this.values.rightDepth = null
    }

    // move left stick to rotate and zoom
    if (Math.abs(this.gamepad.stick.left[0]) > 0.01) {
      this.camera.spin = -this.gamepad.stick.left[0]
      this.inactive = 0
    }
    if (Math.abs(this.gamepad.stick.left[1]) > 0.01) {
      this.camera.zoom = -this.gamepad.stick.left[1]
      this.inactive = 0
    }
    // move right stick to pan and tilt
    if (Math.abs(this.gamepad.stick.right[0]) > 0.01) {
      this.camera.pan = -this.gamepad.stick.right[0]
      this.inactive = 0
    }
    if (Math.abs(this.gamepad.stick.right[1]) > 0.01) {
      this.camera.tilt = -this.gamepad.stick.right[1]
      this.inactive = 0
    }
    // shoulder buttons to move between rooms
    if (this.gamepad.pressed.shoulder.left) {
      this.prevRoom()
    }
    if (this.gamepad.pressed.shoulder.right) {
      this.nextRoom()
    }
    // x button to play a random track
    if (this.gamepad.pressed.buttons.b) {
      this.jockey.randomTrack()
    }
    // trigger buttons to change audio filter
    if (this.gamepad.trigger.left > 0) {
      this.jockey.frequency -= this.gamepad.trigger.left * dt * 0.3
    }
    if (this.gamepad.trigger.right > 0) {
      this.jockey.frequency += this.gamepad.trigger.right * dt * 0.3
    }
    // dpad to change magic
    if (this.gamepad.dpad.right) {
      this.magic += 0.1 * dt
    }
    if (this.gamepad.dpad.left) {
      this.magic -= 0.1 * dt
    }
    if (this.gamepad.pressed.dpad.up) {
      this.magic = 1
    }
    if (this.gamepad.pressed.dpad.down) {
      this.magic = 0
    }
    // back to toggle debug mode
    if (this.gamepad.pressed.back) {
      this.data.debug = !this.data.debug
    }
    // start to do a browser reload
    if (this.gamepad.pressed.start) {
      location.reload()
    }

    // the attract mode takes over after 5 minutes of no activity
    if (this.autopilot.enabled) {
      if (Math.abs(this.autopilot.stick.left[0]) > 0.01) {
        this.camera.spin = -this.autopilot.stick.left[0]
      }
      if (Math.abs(this.autopilot.stick.left[1]) > 0.01) {
        this.camera.zoom = -this.autopilot.stick.left[1]
      }
      if (Math.abs(this.autopilot.stick.right[0]) > 0.01) {
        this.camera.pan = -this.autopilot.stick.right[0]
      }
      if (Math.abs(this.autopilot.stick.right[1]) > 0.01) {
        this.camera.tilt = -this.autopilot.stick.right[1]
      }
      left.position[0] = this.autopilot.hand.left[0] * 100
      left.position[1] = 100
      left.position[2] = this.autopilot.hand.left[1] * 100
      right.position[0] = this.autopilot.hand.right[0] * 100
      right.position[1] = 100
      right.position[2] = this.autopilot.hand.right[1] * 100
      left.alive = true
      right.alive = true
      if (this.autopilot.click) {
        this.nextRoom()
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
    this.data.rooms = this.rooms
    this.data.name = this.room
    this.data.camera.pan = this.camera.pan * 500
    this.data.camera.tilt = this.camera.tilt * 500
    this.data.camera.spin = this.camera.spin * 500
    this.data.camera.zoom = this.camera.zoom * 500
    this.data.music.tracks = this.jockey.tracks
    this.data.music.track = this.jockey.track
    this.data.music.volume = this.jockey.volume * 1000
    this.data.music.frequency = this.jockey.frequency * 1000
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
    this.data.magic = this.magic * 1000
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
      let radius = this.config.rooms[room].radius
      this.entities[room] = new Planet(room, this.textures[room], radius, this.config.planet, this.data.debug)
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
    this.entities['phone'] = new Phone(this.textures['phone'], this.data.debug)
    this.entities['phone'].add(this.world, this.space)
    this.entities['tv'] = new Television(this.textures['tv'], this.data.debug)
    this.entities['tv'].add(this.world, this.space)
  }

  _loadRemoteMusic (url) {
    let options = {
      headers: {
        'Content-Type': 'application/json'
      }
    }
    axios.get(url, options).then(response => {
      for (var room in this.config.rooms) {
        this.config.rooms[room].tracks = response.data
      }
    })
  }
}

export default Room
