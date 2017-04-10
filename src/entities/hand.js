/* global PIXI */
import 'pixi.js'

import Sparks from './sparks'

class Hand {
  constructor (textures, particle, flip = false) {
    this.sprite = new PIXI.extras.AnimatedSprite(textures)
    this.sprite.anchor.x = 0.5
    this.sprite.anchor.y = 0.5
    this.sprite.alpha = 0.5
    this.position = [100, 200, 0]
    this.rotation = [0, 0, 0]
    this.pinch = 0
    this.grab = 0
    this.pose = null
    this.pose_cooldown = 0
    this.gesture = null
    this.gesture_cooldown = 0
    this.trail = true
    this.sparks = new Sparks(particle)
    this.sparks.emitter.maxParticles = 0
    this.flip = flip
    if (flip) {
      this.position[0] *= -1
    }
    this.alive = 0
    this.sprite.visible = false
  }

  leap (hand, gestures) {
    this.alive = 1
    this.position = hand.palmPosition
    this.velocity = hand.palmVelocity
    this.rotation = [hand.pitch(), hand.roll(), hand.yaw()]
    this.pinch = hand.pinchStrength
    this.grab = hand.grabStrength
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

  update (dt, camera, debug) {
    this.pose_cooldown -= dt
    if (this.pose_cooldown < 0) {
      this.pose_cooldown = 0
    }
    this.gesture_cooldown -= dt
    if (this.gesture_cooldown < 0) {
      this.gesture_cooldown = 0
    }
    if (this.pose_cooldown === 0) {
      if (this.grab > 0.6 && !this.pose) {
        this.pose = 'grab'
        this.pose_cooldown = 0.3
        this.sparks.emitter.startColor = [255, 0, 255]
        this.sparks.emitter.endColor = [0, 0, 255]
      } else if (this.grab < 0.3 && this.pose === 'grab') {
        this.pose = null
        this.pose_cooldown = 0.3
        this.sparks.emitter.startColor = [255, 255, 0]
        this.sparks.emitter.endColor = [255, 0, 0]
      } else if (this.pinch > 0.9 && this.grab < 0.3 && !this.pose) {
        this.pose = 'pinch'
        this.pose_cooldown = 0.3
        this.sparks.emitter.startColor = [0, 255, 255]
        this.sparks.emitter.endColor = [0, 255, 0]
      } else if ((this.pinch < 0.6 || this.grab > 0.5) && this.pose === 'pinch') {
        this.pose = null
        this.pose_cooldown = 0.3
        this.sparks.emitter.startColor = [255, 255, 0]
        this.sparks.emitter.endColor = [255, 0, 0]
      }
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
    if (this.alive < 0.67) {
      this.sparks.emitter.maxParticles = 0
      this.grab *= 0.95
      this.pinch *= 0.95
      this.rotation[0] *= 0.99
      this.rotation[1] *= 0.99
      this.rotation[2] *= 0.99
      if (this.flip) {
        this.position[0] -= (this.position[0] + 100) * dt
      } else {
        this.position[0] += (100 - this.position[0]) * dt
      }
      this.position[1] += (200 - this.position[1]) * dt
      this.position[2] += -this.position[2] * dt
    }
    this.alive *= 0.99
    this.sprite.visible = debug
  }

  add (world, group) {
    world.addChild(this.sparks.emitterContainer)
    world.addChild(this.sprite)
    this.sprite.displayGroup = group
    this.sparks.emitterContainer.displayGroup = group
  }

  remove (world) {
    world.removeChild(this.sparks.emitterContainer)
    world.removeChild(this.sprite)
    this.sprite.destroy(true, true)
  }
}

export default Hand
