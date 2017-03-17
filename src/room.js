/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

import Leap from 'leapjs'
import { Howl } from 'howler'

import Hand from 'entities/hand.js'
import Camera from 'entities/camera.js'
import Jockey from 'entities/jockey.js'

// import Socket from './socket'

const WIDTH = 1200
const HEIGHT = 675
const RATIO = WIDTH / HEIGHT
const FPS = 50

const MUSIC = [
  'bensound-dubstep',
  'bensound-moose'
]

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
    this.music = {}
    this.entities = {}
    this.values = {}
    this.data = null
  }

  load (callback) {
    for (var name of MUSIC) {
      this.music[name] = new Howl({
        src: [require(`assets/${name}.webm`), require(`assets/${name}.mp3`)],
        loop: true
      })
    }
    for (name of TEXTURES) {
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

  init (data) {
    this.data = data
    this.engine = new PIXI.Application(WIDTH, HEIGHT, {
      view: this.canvas,
      antialias: true
    })
    this.world = new PIXI.Container()
//  this.socket = new Socket()
    this.socket = null
    this.engine.stage.addChild(this.world)
    this.size()
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
    this.track = null
    this.spawnHand('left', 'left')
    this.spawnHand('right', 'right')
    this.camera = new Camera(this.socket)
    this.jockey = new Jockey(this.music, this.socket)
    Leap.loop({ background: true }, (frame) => this.leap(frame.timestamp, frame.hands, frame.gestures))
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

  leap (ms, hands, gestures) {
    hands.forEach(hand => {
      if (hand.valid && hand.confidence > 0.2) {
        let entity = this.entities[hand.type]
        entity.leap(hand, gestures)
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
    // scan gamepads and update entities

    // update entities
    for (var id in this.entities) {
      this.entities[id].update(dt)
    }

    // use inputs to drive actions
    this.actions(dt)

    // CAMERA
    this.camera.update(dt)
    this.stars.rotation = this.camera.angle
    this.planet.rotation = this.camera.angle
    this.planet.scale.x = this.camera.scale
    this.planet.scale.y = this.camera.scale
    this.planet.position.x = this.camera.position[0]
    this.planet.position.y = this.camera.position[1]

    // LIGHTS
    // this.socket.send('colour', this.data.lights.colour)
    // this.socket.send('pattern', this.data.lights.pattern)

    // MUSIC
    this.jockey.update(dt)
    // this.socket.send('volume', this.data.music.volume)
    /*
    if (this.track !== this.data.music.track) {
      if (this.track) {
        this.music[this.track].stop()
      }
      this.track = this.data.music.track
      this.music[this.track].play()
    }
    if (this.track) {
      this.music[this.track].volume(this.data.music.volume * 0.001)
    }
    */

    // VISUALS
    /*
    this.entities['left'].trail = false
    this.entities['right'].trail = false
    for (var effect of this.data.visual.effect) {
      this.entities['left'].trail = (effect === 'trails')
      this.entities['right'].trail = (effect === 'trails')
    }
    */

    if (this.data.debug) {
      this.debug(dt)
    }
  }

  // this is where we hook inputs to actions
  actions (dt) {
    let left = this.entities.left
    let right = this.entities.right

    // open hands and tilt in opposite directions to rotate camera
    if (!left.pose && !right.pose) {
      let spin = (left.rotation[0] - right.rotation[0])
      spin *= Math.abs(spin)
      spin *= Math.abs(spin)
      spin *= 30
      if (Math.abs(spin) > 1) {
        this.camera.spin = spin
      }
    }

    // pinch with both hands and move to zoom in and out
    if (left.pose === 'pinch' && right.pose === 'pinch') {
      let distance = (left.position[0] - right.position[0])
      if (this.values.zoom) {
        this.camera.zoom = this.values.zoom - distance
        this.camera.zoom /= 100
        this.camera.zoom *= Math.abs(this.camera.zoom)
        this.camera.zoom *= 100
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
        this.camera.pan = this.values.pan - position
        this.camera.pan /= 100
        this.camera.pan *= Math.abs(this.camera.pan)
        this.camera.pan *= 100
      } else {
        this.values.pan = position
      }
      position = 0.5 * (left.position[2] + right.position[2])
      if (this.values.tilt) {
        this.camera.tilt = this.values.tilt - position
        this.camera.tilt /= 100
        this.camera.tilt *= Math.abs(this.camera.tilt)
        this.camera.tilt *= 200
      } else {
        this.values.tilt = position
      }
    } else {
      this.values.pan = null
      this.values.tilt = null
    }

    // swipe with right hand to change track
    if (right.gesture === 'swipe_left') {
      this.jockey.prevTrack()
    }
    if (right.gesture === 'swipe_right') {
      this.jockey.nextTrack()
    }

    // pinch with right hand to change music volume
    if (right.pose === 'pinch' && !left.pose) {
      let height = right.position[1]
      if (this.values.height) {
        let diff = height - this.values.height
        diff *= 5
        this.jockey.volume = this.values.volume + diff
      } else {
        this.values.volume = this.jockey.volume
        this.values.height = height
      }
    } else {
      this.values.volume = null
      this.values.height = null
    }

    // pinch with left hand and tap with right hand to toggle particle trails
    /*
    if (left.gesture === 'circle' && left.pose === 'pinch') {
      let index = this.data.visual.effect.indexOf('trails')
      if (index < 0) {
        this.data.visual.effect.push('trails')
      } else {
        this.data.visual.effect.splice(index, 1)
      }
    }
    */
  }

  debug (dt) {
    ['left', 'right'].forEach(id => {
      this.data.hands[id].position = this.entities[id].position
      this.data.hands[id].rotation = this.entities[id].rotation
      this.data.hands[id].pinch = this.entities[id].pinch
      this.data.hands[id].grab = this.entities[id].grab
      this.data.hands[id].gesture = this.entities[id].gesture
    })
    this.data.camera.pan = this.camera.pan
    this.data.camera.tilt = this.camera.tilt
    this.data.camera.spin = this.camera.spin
    this.data.camera.zoom = this.camera.zoom
    this.data.music.track = this.jockey.track
    this.data.music.volume = this.jockey.volume
    this.data.music.filter = this.jockey.filter
    this.data.music.frequency = this.jockey.frequency
    this.data.music.quality = this.jockey.quality
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
    for (name of MUSIC) {
      this.music[name].unload()
    }
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
