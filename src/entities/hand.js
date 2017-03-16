/* global PIXI */
import 'pixi.js'

import Sparks from 'sparks'

const TEXTURES = ['open', 'closed', 'point', 'pinch']

class Hand {
  constructor (textures, data, flip = false) {
    this.sprite = new PIXI.extras.AnimatedSprite(
      TEXTURES.map(name => textures[name])
    )
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.alpha = 0.5
    this.data = data
    this.pose = null
    this.pose_cooldown = 0
    this.gesture = null
    this.gesture_cooldown = 0
    this.trail = false
    this.flip = flip
    this.sparks = new Sparks(textures['particle'])
  }

  control (hand, gestures) {
    this.data.position = hand.palmPosition
    this.velocity = hand.palmVelocity
    this.data.rotation = [hand.pitch(), hand.roll(), hand.yaw()]
    this.data.pinch = hand.pinchStrength
    this.data.grab = hand.grabStrength
    if (this.pose_cooldown === 0) {
      if (this.data.grab > 0.6 && !this.pose) {
        this.pose = 'grab'
        this.pose_cooldown = 0.3
      } else if (this.data.grab < 0.3 && this.pose === 'grab') {
        this.pose = null
        this.pose_cooldown = 0.3
      } else if (this.data.pinch > 0.9 && this.data.grab < 0.3 && !this.pose) {
        this.pose = 'pinch'
        this.pose_cooldown = 0.3
      } else if ((this.data.pinch < 0.6 || this.data.grab > 0.5) && this.pose === 'pinch') {
        this.pose = null
        this.pose_cooldown = 0.3
      }
    }
    this.gesture = null
    if (this.gesture_cooldown === 0) {
      this.data.gesture = null
      for (var gesture of gestures) {
        if (gesture.state === 'stop' && gesture.handIds[0] === hand.id) {
          if (gesture.type === 'swipe') {
            if (gesture.direction[0] > 0.7) {
              this.data.gesture = 'swipe_right'
              this.gesture_cooldown = 0.3
            } else if (gesture.direction[0] < -0.7) {
              this.data.gesture = 'swipe_left'
              this.gesture_cooldown = 0.3
            }
          }
          if (gesture.type === 'circle') {
            if (gesture.radius > 30) {
              this.data.gesture = 'circle'
              this.gesture_cooldown = 0.3
            }
          }
          if (gesture.type === 'keyTap') {
            if (gesture.direction[2] > 0.1) {
              this.data.gesture = 'tap'
              this.gesture_cooldown = 0.3
            }
          }
          if (gesture.type === 'screenTap') {
            this.data.gesture = 'poke'
            this.gesture_cooldown = 0.3
          }
        }
      }
      this.gesture = this.data.gesture
    }
  }

  update (dt) {
    this.pose_cooldown -= dt
    if (this.pose_cooldown < 0) {
      this.pose_cooldown = 0
    }
    this.gesture_cooldown -= dt
    if (this.gesture_cooldown < 0) {
      this.gesture_cooldown = 0
    }
    this.sparks.emitter.update(dt)
    this.sprite.position.x = this.data.position[0] * 2.5
    this.sprite.position.y = this.data.position[2] * 2.5
    let scale = this.data.position[1] / 100.0
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
    this.sprite.rotation = this.data.rotation[2]
    this.sparks.emitter.maxParticles = 0
    if (this.trail) {
      this.sparks.emitter.maxParticles = 100
    }
    if (this.pose === 'grab') {
      this.sprite.gotoAndStop(1)
    } else if (this.pose === 'pinch') {
      this.sprite.gotoAndStop(3)
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
