/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

import Leap from 'leapjs'
import { Howl } from 'howler'

import Hand from 'entities/hand.js'

import Socket from './socket'

const WIDTH = 1200
const HEIGHT = 675
const RATIO = WIDTH / HEIGHT

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
  constructor (elementId, data) {
    window.room = this
    this.data = data
    this.canvas = document.getElementById(elementId)
    this.textures = {}
    this.music = {}
    this.entities = {}
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

  init () {
    this.engine = new PIXI.Application(WIDTH, HEIGHT, {
      view: this.canvas,
      antialias: true
    })
    this.world = new PIXI.Container()
    this.socket = new Socket()
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
    this.channels = []
    for (var name of MUSIC) {
      let id = this.music[name].play()
      this.music[name].volume(0, id)
      this.channels.push(id)
    }
    Leap.loop({}, (frame) => this.loop(frame.timestamp, frame.hands))
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

  loop (ms, hands) {
    let alive = []
    let spin = 0
    let zoom = 0
    let tx = 0
    let ty = 0
    hands.forEach(hand => {
      if (hand.valid && hand.confidence > 0.3) {
        let entity = this.entities[hand.id] || this.spawnHand(hand.id, hand.type)
        alive.push(hand.id.toString())
        entity.position = hand.palmPosition
        entity.rotation = [hand.pitch(), hand.roll(), hand.yaw()]
        entity.pinch = hand.pinchStrength
        entity.grab = hand.grabStrength
        if (entity.pinch < 0.5 && entity.grab < 0.5) {
          if (hand.type === 'left') {
            spin += entity.rotation[0]
            zoom -= entity.rotation[1]
            tx += entity.rotation[1]
            ty -= entity.rotation[0]
          } else {
            spin -= entity.rotation[0]
            zoom += entity.rotation[1]
            tx += entity.rotation[1]
            ty -= entity.rotation[0]
          }
        }
        if (entity.grab > 0.7) {
          let volume = (entity.position[1] - 50) / 400.0
          if (volume < 0) {
            volume = 0
          } else if (volume > 1) {
            volume = 1
          }
          this.socket.send('volume', volume)
          if (hand.type === 'left') {
            this.music[MUSIC[0]].volume(volume, this.channels[0])
          } else {
            this.music[MUSIC[1]].volume(volume, this.channels[1])
          }
        }
        entity.update(ms)
      }
    })
    for (var id in this.entities) {
      if (alive.indexOf(id) < 0) {
        this.entities[id].remove(this.world)
        delete this.entities[id]
      }
    }
    this.stars.rotation += spin * 0.01
    this.planet.rotation += spin * 0.01
    this.planet.scale.x += zoom * 0.001
    this.planet.scale.y += zoom * 0.001
    this.planet.position.x += tx
    this.planet.position.y += ty
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
