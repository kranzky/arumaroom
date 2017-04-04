/* global PIXI */
import 'pixi.js'

const RADIUS = 1000

class Planet {
  constructor (texture) {
    this.sprite = new PIXI.Sprite(texture)
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.scale.x = RADIUS / this.sprite.texture.width
    this.sprite.scale.y = RADIUS / this.sprite.texture.height
  }

  update (dt, camera, debug) {
  }

  add (world) {
    world.addChild(this.sprite)
  }

  remove (world) {
    world.removeChild(this.sprite)
    this.sprite.destroy(true, true)
  }
}

export default Planet
