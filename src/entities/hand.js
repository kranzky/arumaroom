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
    this.position = [100, 200, 100]
    this.rotation = [0, 0, 0]
    this.pinch = 0
    this.grab = 0
    this.pose = null
    this.pose_cooldown = 0
    this.gesture = null
    this.gesture_cooldown = 0
    this.trail = true
    this.sparks = new Sparks(textures['particle'])
    this.flip = flip
    if (flip) {
      this.position[0] *= -1
    }
  }

  leap (hand, gestures) {
    this.position = hand.palmPosition
    this.velocity = hand.palmVelocity
    this.rotation = [hand.pitch(), hand.roll(), hand.yaw()]
    this.pinch = hand.pinchStrength
    this.grab = hand.grabStrength
    if (this.pose_cooldown === 0) {
      if (this.grab > 0.6 && !this.pose) {
        this.pose = 'grab'
        this.pose_cooldown = 0.3
      } else if (this.grab < 0.3 && this.pose === 'grab') {
        this.pose = null
        this.pose_cooldown = 0.3
      } else if (this.pinch > 0.9 && this.grab < 0.3 && !this.pose) {
        this.pose = 'pinch'
        this.pose_cooldown = 0.3
      } else if ((this.pinch < 0.6 || this.grab > 0.5) && this.pose === 'pinch') {
        this.pose = null
        this.pose_cooldown = 0.3
      }
    }
    if (this.gesture_cooldown === 0) {
      this.gesture = null
      for (var gesture of gestures) {
        if (gesture.state === 'stop' && gesture.handIds[0] === hand.id) {
          if (gesture.type === 'swipe') {
            if (gesture.direction[0] > 0.7) {
              this.gesture = 'swipe_right'
              this.gesture_cooldown = 0.3
            } else if (gesture.direction[0] < -0.7) {
              this.gesture = 'swipe_left'
              this.gesture_cooldown = 0.3
            }
          }
          if (gesture.type === 'circle') {
            if (gesture.radius > 30) {
              this.gesture = 'circle'
              this.gesture_cooldown = 0.3
            }
          }
          if (gesture.type === 'keyTap') {
            if (gesture.direction[2] > 0.1) {
              this.gesture = 'tap'
              this.gesture_cooldown = 0.3
            }
          }
          if (gesture.type === 'screenTap') {
            this.gesture = 'poke'
            this.gesture_cooldown = 0.3
          }
        }
      }
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
