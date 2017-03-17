/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

import Leap from 'leapjs'
import { Howl } from 'howler'

import Hand from 'entities/hand.js'

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
    this.planet.scale.x = 0.1
    this.planet.scale.y = 0.1
    this.world.addChild(this.planet)
    this.track = null
    this.spawnHand('left', 'left')
    this.spawnHand('right', 'right')
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
    // this.actions(dt)

    // use actions to drive CAMERA
    /*
    this.stars.rotation += this.data.camera.tilt * dt * 0.003
    this.planet.rotation += this.data.camera.tilt * dt * 0.003
    this.planet.scale.x += this.data.camera.zoom * dt * 0.001
    this.planet.scale.y += this.data.camera.zoom * dt * 0.001
    this.planet.position.x += this.data.camera.pan[0] * dt
    this.planet.position.y += this.data.camera.pan[1] * dt
    */

    // and LIGHTS
    // this.socket.send('colour', this.data.lights.colour)
    // this.socket.send('pattern', this.data.lights.pattern)

    // and MUSIC
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

    // and VISUALS
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

  debug (dt) {
    ['left', 'right'].forEach(id => {
      this.data.hands[id].position = this.entities[id].position
      this.data.hands[id].rotation = this.entities[id].rotation
      this.data.hands[id].pinch = this.entities[id].pinch
      this.data.hands[id].grab = this.entities[id].grab
      this.data.hands[id].gesture = this.entities[id].gesture
    })
  }

  // this is where we hook inputs to actions
  actions (dt) {
    let left = this.entities.left
    let right = this.entities.right

    // open hands and tilt in opposite directions to rotate camera
    if (!left.pose && !right.pose) {
      this.data.camera.tilt = 200 * (left.data.rotation[0] - right.data.rotation[0])
      this.data.camera.tilt = 200 * (left.data.rotation[0] - right.data.rotation[0])
      if (this.data.camera.tilt > 500) {
        this.data.camera.tilt = 500
      } else if (this.data.camera.tilt < -500) {
        this.data.camera.tilt = -500
      }
    }

    // swipe with right hand to change track
    if (right.gesture === 'swipe_left') {
      let id = MUSIC.indexOf(this.data.music.track) - 1
      if (id < 0) {
        id = MUSIC.length - 1
      }
      this.data.music.track = MUSIC[id]
    }
    if (right.gesture === 'swipe_right') {
      let id = this.data.music.tracks.indexOf(this.data.music.track) + 1
      if (id >= MUSIC.length) {
        id = 0
      }
      this.data.music.track = MUSIC[id]
    }

    // pinch with left hand and draw a circle to toggle particle trails
    if (left.gesture === 'circle' && left.pose === 'pinch') {
      let index = this.data.visual.effect.indexOf('trails')
      if (index < 0) {
        this.data.visual.effect.push('trails')
      } else {
        this.data.visual.effect.splice(index, 1)
      }
    }

    // grab with both hands to zoom in and out
    if (left.pose === 'grab' && right.pose === 'grab') {
      this.data.camera.zoom = 500 - (left.data.position[1] + right.data.position[1] - 100) * 2.5
      if (this.data.camera.zoom > 500) {
        this.data.camera.zoom = 500
      } else if (this.data.camera.zoom < -500) {
        this.data.camera.zoom = -500
      }
    }

    // pinch with right hand to change music volume
    if (right.pose === 'pinch') {
      this.data.music.volume = (right.data.position[1] - 50) * 2.5
      if (this.data.music.volume > 1000) {
        this.data.music.volume = 1000
      } else if (this.data.music.volume < 0) {
        this.data.music.volume = 0
      }
    }
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
