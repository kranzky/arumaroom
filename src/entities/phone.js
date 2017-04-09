/* global PIXI */
import 'pixi.js'

class Phone {
  constructor (texture, debug) {
    this.debug = debug
    let style = new PIXI.TextStyle({
      fontFamily: 'Courier',
      fontSize: 24,
      fill: ['#ffff00', '#ffcc00'],
      dropShadow: true,
      dropShadowBlur: 3
    })
    this.text = new PIXI.Text('This is a test!', style)
    this.text.anchor.x = 0.5
    this.text.anchor.y = 0.5
    this.text.position.y = 320
    this.sprite = new PIXI.Sprite(texture)
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.position.x = -540
    this.sprite.position.y = -240
    this.sprite.scale.x = 0.1
    this.sprite.scale.y = 0.1
    this.state = null
    this.time = 0
    this.flash = 0
    this.sprite.visible = false
    this.text.visible = false
  }

  setMessage (message) {
    this.text.alpha = 0
    this.text.visible = true
    this.text.text = message
    this.state = 'fadeIn'
    this.time = 1000
    this.sprite.visible = true
  }

  update (dt, camera, debug) {
    this.flash += dt
    if (!this.text.visible) {
      return
    }
    this.sprite.alpha = 0.5 + 0.5 * Math.sin(this.flash * 10)
    this.time -= dt * 1000
    switch (this.state) {
      case 'fadeIn':
        if (this.time <= 0) {
          this.state = 'show'
          this.time = 4000
        } else {
          this.text.alpha += dt
        }
        break
      case 'show':
        if (this.time <= 0) {
          this.state = 'fadeOut'
          this.time = 1000
          this.text.alpha = 1
        }
        break
      case 'fadeOut':
        if (this.time <= 0) {
          this.text.visible = false
          this.sprite.visible = false
          this.state = null
        } else {
          this.text.alpha -= dt
        }
        break
    }
  }

  add (world, group) {
    world.addChild(this.text)
    this.text.displayGroup = group
    world.addChild(this.sprite)
    this.sprite.displayGroup = group
  }

  remove (world) {
    world.removeChild(this.text)
    this.text.destroy(true, true)
    world.removeChild(this.sprite)
    this.sprite.destroy(true, true)
  }
}

export default Phone
