/* global PIXI */
import 'pixi.js'

const TEXTURES = ['open', 'closed', 'point', 'pinch']

class Hand {
  constructor (textures, flip = false) {
    this.sprite = new PIXI.extras.AnimatedSprite(
      TEXTURES.map(name => textures[name])
    )
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.alpha = 0.5
    this.position = [0, 0, 0]
    this.rotation = [0, 0, 0]
    this.pinch = 0
    this.grab = 0
    this.flip = flip
  }

  update () {
    this.sprite.position.x = this.position[0] * 2.5
    this.sprite.position.y = this.position[2] * 2.5
    let scale = this.position[1] / 100.0
    this.sprite.scale.x = scale
    this.sprite.scale.y = scale
    if (this.flip) {
      this.sprite.scale.x *= -1
    }
    this.sprite.rotation = this.rotation[2]
    if (this.grab > 0.8) {
      this.sprite.gotoAndStop(1)
    } else if (this.pinch > 0.5) {
      this.sprite.gotoAndStop(3)
    } else {
      this.sprite.gotoAndStop(0)
    }
  }

  add (world) {
    world.addChild(this.sprite)
  }

  remove (world) {
    world.removeChild(this.sprite)
    this.sprite.destroy(true, true)
  }
}

export default Hand
