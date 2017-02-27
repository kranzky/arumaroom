/* global PIXI */
import 'pixi.js'

import Hand from 'entities/hand.js'

const WIDTH = 1200
const HEIGHT = 675

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
    this.view = new PIXI.Application(WIDTH, HEIGHT, {
      view: this.canvas,
      antialias: true
    })
    this.world = new PIXI.Container()
    this.view.stage.addChild(this.world)
    this.entities['left_hand'] = new Hand(this.textures)
    this.entities['right_hand'] = new Hand(this.textures, true)
    this.entities['left_hand'].add(this.world)
    this.entities['right_hand'].add(this.world)
    this.entities['left_hand'].set(100, 100, 'pinch')
    this.entities['right_hand'].set(200, 100, 'pinch')
  }

  size () {
  }

  fini () {
    this.entities['left_hand'].remove(this.world)
    this.entities['right_hand'].remove(this.world)
    for (var name of TEXTURES) {
      this.textures[name].destroy(true)
    }
    PIXI.loader.reset()
    this.world.destroy()
    this.view.destroy()
    window.room = undefined
  }
}

export default Room
