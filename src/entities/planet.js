/* global PIXI */
import 'pixi.js'

const SCREEN_BORDER = 50

class Planet {
  constructor (texture, radius) {
    this.sprite = new PIXI.Sprite(texture)
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.visible = false
    this.worldRadius = radius
    this.worldPosition = [0, 0, 0]
    this._spawn()
  }

  // TODO: z-order
  // TODO: screen rotation
  update (dt, camera, debug) {
    this.worldPosition[0] -= 5000 * camera.pan * dt
    this.worldPosition[1] -= 5000 * camera.tilt * dt
    this.worldPosition[2] -= 100 * camera.zoom * dt

    if (this.worldPosition[2] > 500) {
      this.worldPosition[2] = -10
    } else if (this.worldPosition[2] < -10) {
      this.worldPosition[2] = 500
    }

    let screenPosition = camera.worldToScreen(this.worldPosition)

    if (!screenPosition) {
      this.sprite.visible = false
      return
    }

    let screenRadius = camera.worldToScreen([this.worldRadius, this.worldRadius, this.worldPosition[2]])[0]

    let alpha = 1
    let pos = screenPosition[0] - 0.5 * screenRadius
    if (pos > camera.screenCentre[0] + SCREEN_BORDER) {
      // respawn
    } else if (pos > camera.screenCentre[0] - SCREEN_BORDER) {
      alpha = Math.min(alpha, (camera.screenCentre[0] - pos) / SCREEN_BORDER)
    }
    pos = screenPosition[0] + 0.5 * screenRadius
    if (pos < -camera.screenCentre[0] - SCREEN_BORDER) {
      // respawn
    } else if (pos < -camera.screenCentre[0] + SCREEN_BORDER) {
      alpha = Math.min(alpha, (camera.screenCentre[0] + pos) / SCREEN_BORDER)
    }
    pos = screenPosition[1] - 0.5 * screenRadius
    if (pos > camera.screenCentre[1] + SCREEN_BORDER) {
      // respawn
    } else if (pos > camera.screenCentre[1] - SCREEN_BORDER) {
      alpha = Math.min(alpha, (camera.screenCentre[1] - pos) / SCREEN_BORDER)
    }
    pos = screenPosition[1] + 0.5 * screenRadius
    if (pos < -camera.screenCentre[1] - SCREEN_BORDER) {
      // respawn
    } else if (pos < -camera.screenCentre[1] + SCREEN_BORDER) {
      alpha = Math.min(alpha, (camera.screenCentre[1] + pos) / SCREEN_BORDER)
    }
    if (this.worldPosition[2] < 2) {
      alpha = Math.min(alpha, this.worldPosition[2] / 2)
    } else if (this.worldPosition[2] > 400) {
      alpha = Math.min(alpha, (500 - this.worldPosition[2]) / 100)
    }
    if (alpha < 0) {
      alpha = 0
    }

    this.sprite.position.x = screenPosition[0]
    this.sprite.position.y = screenPosition[1]
    this.sprite.scale.x = screenRadius / this.sprite.texture.width
    this.sprite.scale.y = screenRadius / this.sprite.texture.height
    this.sprite.rotation = camera.angle
    this.sprite.alpha = alpha
    this.sprite.visible = true
  }

  add (world) {
    world.addChild(this.sprite)
  }

  remove (world) {
    world.removeChild(this.sprite)
    this.sprite.destroy(true, true)
  }

  // TODO: reverse transform
  _spawn () {
    this.worldPosition[0] = Math.random() * 10000 - Math.random() * 10000
    this.worldPosition[1] = Math.random() * 10000 - Math.random() * 10000
    this.worldPosition[2] = Math.random() * 300 + 100
  }
}

export default Planet
