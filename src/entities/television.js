/* global PIXI */
import 'pixi.js'

class Television {
  constructor (texture, debug) {
    this.debug = debug
    this.sprite = new PIXI.Sprite(texture)
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.scale.x = 0.1
    this.sprite.scale.y = 0.1
    this.sprite.visible = false
    this.screen = new PIXI.Sprite(texture)
    this.screen.anchor.x = 0.5
    this.screen.anchor.y = 0.5
    this.screen.scale.x = 0.1
    this.screen.scale.y = 0.1
    this.screen.visible = false
    this.state = null
    this.time = 0
    this.worldRadius = 100
    this.worldPosition = [0, 0, 100]
    this.player = document.createElement('video')
    this.player.preload = 'auto'
    this.player.loop = true
  }

  playVideo (url) {
    this.player.src = url
    this.screen.texture = PIXI.Texture.fromVideo(this.player)
    this.screen.visible = true
    this.sprite.visible = true
  }

  stopVideo () {
    this.sprite.visible = false
    this.screen.visible = false
    this.screen.texture.destroy(true)
    this.player.src = null
  }

  update (dt, camera, debug) {
    if (this.screen.visible === false) {
      return
    }

    let screenPosition = camera.worldToScreen(this.worldPosition, true)

    if (!screenPosition) {
      return
    }

    let screenRadius = camera.worldToScreen([this.worldRadius, this.worldRadius, this.worldPosition[2]])[0]

    this.sprite.position.x = screenPosition[0]
    this.sprite.position.y = screenPosition[1]
    this.sprite.scale.x = screenRadius * 1.4 / this.sprite.texture.width
    this.sprite.scale.y = screenRadius / this.sprite.texture.height
    this.sprite.rotation = camera.angle
    this.sprite.zOrder = this.worldPosition[2]
    this.sprite.visible = true

    this.screen.position.x = screenPosition[0]
    this.screen.position.y = screenPosition[1]
    this.screen.scale.x = screenRadius * 1.4 / this.screen.texture.width * 0.85
    this.screen.scale.y = screenRadius / this.screen.texture.height * 0.85
    this.screen.rotation = camera.angle
    this.screen.zOrder = this.worldPosition[2] + 1
    this.screen.visible = true
  }

  add (world, group) {
    world.addChild(this.sprite)
    this.sprite.displayGroup = group
    world.addChild(this.screen)
    this.screen.displayGroup = group
  }

  remove (world) {
    world.removeChild(this.sprite)
    this.sprite.destroy(true, true)
    world.removeChild(this.screen)
    this.screen.destroy(true, true)
  }
}

export default Television
