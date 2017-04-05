/* global PIXI */
import 'pixi.js'

const FADE = 1000
const SHOW = 3000

class Caption {
  constructor () {
    let style = new PIXI.TextStyle({
      fontFamily: 'Chalkduster',
      fontSize: 100,
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
    this.time = FADE
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
          this.time = SHOW
        } else {
          this.text.alpha += dt * (FADE / 1000)
        }
        break
      case 'show':
        if (this.time <= 0) {
          this.state = 'fadeOut'
          this.time = FADE
          this.text.alpha = 1
        }
        break
      case 'fadeOut':
        if (this.time <= 0) {
          this.text.visible = false
          this.state = null
        } else {
          this.text.alpha -= dt * (FADE / 1000)
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
