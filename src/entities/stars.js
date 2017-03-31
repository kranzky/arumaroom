/* global PIXI */
import 'pixi.js'

const RADIUS = 2000

class Stars {
  constructor (texture) {
    this.zoom = 0
    this.sprite = new PIXI.Sprite(texture)
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.scale.x = RADIUS / this.sprite.texture.width
    this.sprite.scale.y = RADIUS / this.sprite.texture.height
  }

  update (dt, camera) {
    this.sprite.rotation = camera.angle
    this.sprite.x = this._shift(this.sprite.x, camera.pan * dt)
    this.sprite.y = this._shift(this.sprite.y, camera.tilt * dt)
    this.zoom = this._shift(this.zoom, camera.zoom * dt)
    this.sprite.scale.x = (RADIUS + this.zoom * 4) / this.sprite.texture.width
    this.sprite.scale.y = (RADIUS + this.zoom * 4) / this.sprite.texture.height
  }

  add (world) {
    world.addChild(this.sprite)
  }

  remove (world) {
    world.removeChild(this.sprite)
    this.sprite.destroy(true, true)
  }

  _shift (value, amount) {
    let diff = 100 - Math.abs(value)
    value += amount * diff
    value *= 0.99
    if (value > 100) {
      value = 100
    }
    if (value < -100) {
      value = -100
    }
    return value
  }
}

export default Stars
