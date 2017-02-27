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
  }

  load (callback) {
    for (var texture of TEXTURES) {
      PIXI.loader.add(texture, require(`assets/${texture}.png`))
    }
    PIXI.loader.once('complete', callback)
    PIXI.loader.load()
  }

  init () {
    this.view = new PIXI.Application(WIDTH, HEIGHT, {
      view: this.canvas,
      antialias: true
    })
    this.world = new PIXI.Container()
    this.view.stage.addChild(this.world)
    let rightHand = new Hand(false)
    let leftHand = new Hand(true)
    leftHand.add(this.world)
    rightHand.add(this.world)
    leftHand.set(100, 100, 'pinch')
    rightHand.set(200, 100, 'pinch')
  }

  size () {
  }

  fini () {
  }
}

export default Room
