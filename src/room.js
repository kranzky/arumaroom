/* global PIXI */
import 'pixi.js'
import Leap from 'leapjs'

import Hand from 'entities/hand.js'

const WIDTH = 1200
const HEIGHT = 675
const RATIO = WIDTH / HEIGHT

const TEXTURES = [
  'open',
  'closed',
  'point',
  'pinch'
]

class Room {
  constructor (elementId, data) {
    window.room = this
    this.data = data
    this.canvas = document.getElementById(elementId)
    this.textures = {}
    this.entities = {}
  }

  load (callback) {
    for (var name of TEXTURES) {
      PIXI.loader.add(name, require(`assets/${name}.png`))
    }
    PIXI.loader.once('complete', () => {
      for (var name of TEXTURES) {
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
    this.engine.stage.addChild(this.world)
    this.size()
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
    hands.forEach(hand => {
      if (hand.valid && hand.confidence > 0.3) {
        let entity = this.entities[hand.id] || this.spawnHand(hand.id, hand.type)
        entity.position = hand.palmPosition
        entity.rotation = [hand.pitch(), hand.roll(), hand.yaw()]
        entity.pinch = hand.pinchStrength
        entity.grab = hand.grabStrength
        entity.update(ms)
      }
    })
  }

  fini () {
    for (var id of this.entities) {
      this.entities[id].remove(this.world)
    }
    for (var name of TEXTURES) {
      this.textures[name].destroy(true)
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
