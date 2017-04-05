/* global PIXI */
import 'pixi.js'

class Caption {
  constructor (config, debug) {
    this.config = config
    this.debug = debug
    let style = new PIXI.TextStyle({
      fontFamily: 'Chalkduster',
      fontSize: 72,
      fill: ['#aaffcc', '#ffaacc'],
      dropShadow: true,
      dropShadowBlur: 3
    })
    this.text = new PIXI.Text('', style)
    this.text.anchor.x = 0.5
    this.text.anchor.y = 0.5
    this.state = null
    this.time = 0
    this.text.visible = false
  }

  setMessage (message) {
    if (this.text.visible) {
      return
    }
    this.text.alpha = 0
    this.text.visible = true
    this.text.text = message
    this.state = 'fadeIn'
    this.time = this.config.fade
  }

  update (dt, camera, debug) {
    if (!this.text.visible) {
      return
    }
    this.time -= dt * 1000
    switch (this.state) {
      case 'fadeIn':
        if (this.time <= 0) {
          this.state = 'show'
          this.time = this.config.show
        } else {
          this.text.alpha += dt * (this.config.fade / 1000)
        }
        break
      case 'show':
        if (this.time <= 0) {
          this.state = 'fadeOut'
          this.time = this.config.fade
          this.text.alpha = 1
        }
        break
      case 'fadeOut':
        if (this.time <= 0) {
          this.text.visible = false
          this.state = null
        } else {
          this.text.alpha -= dt * (this.config.fade / 1000)
        }
        break
    }
  }

  add (world, group) {
    world.addChild(this.text)
    this.text.displayGroup = group
  }

  remove (world) {
    world.removeChild(this.text)
    this.text.destroy(true, true)
  }
}

export default Caption
