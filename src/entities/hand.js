/* global PIXI */
import 'pixi.js'

import Sparks from 'sparks'

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
    this.sparks = new Sparks(textures['particle'])
  }

  update () {
    this.sparks.emitter.update(0.02)
    this.sprite.position.x = this.position[0] * 2.5
    this.sprite.position.y = this.position[2] * 2.5
    let scale = this.position[1] / 100.0
    this.sprite.scale.x = scale
    this.sprite.scale.y = scale
    this.sparks.emitter.updateOwnerPos(this.sprite.position.x, this.sprite.position.y)
    this.sparks.emitter.startScale = scale * 0.4
    this.sparks.emitter.endScale = 0.1 * scale
    if (this.flip) {
      this.sprite.scale.x *= -1
      this.sparks.emitter.spawnPos.x = 24 * scale
    } else {
      this.sparks.emitter.spawnPos.x = -24 * scale
    }
    this.sprite.rotation = this.rotation[2]
    this.sparks.emitter.maxParticles = 0
    if (this.grab > 0.7) {
      this.sprite.gotoAndStop(1)
    } else if (this.pinch > 0.9 && this.grab < 0.8) {
      this.sprite.gotoAndStop(3)
      this.sparks.emitter.maxParticles = 100
    } else {
      this.sprite.gotoAndStop(0)
    }
  }

  add (world) {
    world.addChild(this.sparks.emitterContainer)
    world.addChild(this.sprite)
  }

  remove (world) {
    world.removeChild(this.sparks.emitterContainer)
    world.removeChild(this.sprite)
    this.sprite.destroy(true, true)
  }
}

export default Hand
