/* global PIXI */
import 'pixi.js'

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
    this.spawn()
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

  fini () {
    this.entities['left_hand'].remove(this.world)
    this.entities['right_hand'].remove(this.world)
    for (var name of TEXTURES) {
      this.textures[name].destroy(true)
    }
    PIXI.loader.reset()
    this.world.destroy()
    this.engine.destroy()
    window.room = undefined
  }

  spawn () {
    this.entities['left_hand'] = new Hand(this.textures, true)
    this.entities['right_hand'] = new Hand(this.textures)
    this.entities['left_hand'].add(this.world)
    this.entities['right_hand'].add(this.world)
    this.entities['left_hand'].set(-600, -337, 'pinch')
    this.entities['right_hand'].set(600, 337, 'pinch')
  }
}

export default Room
