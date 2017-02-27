/* global PIXI */
import 'pixi.js'

const TEXTURES = ['open', 'closed', 'point', 'pinch']

class Hand {
  constructor (flip = false) {
    this.sprite = new PIXI.extras.AnimatedSprite(
      TEXTURES.map(name => PIXI.loader.resources[name].texture)
    )
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    if (flip) {
      this.sprite.scale.x *= -1
    }
  }

  add (world) {
    world.addChild(this.sprite)
  }

  set (x = 0, y = 0, gesture = 'open') {
    this.sprite.position.x = x
    this.sprite.position.y = y
    this.sprite.gotoAndStop(TEXTURES.indexOf(gesture))
  }

  remove (world) {
    world.removeChild(this.sprite)
  }
}

export default Hand
