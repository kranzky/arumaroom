/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

class Sparks {
  constructor (texture) {
    let config = {
      'alpha': {
        'start': 0.8,
        'end': 0.1
      },
      'color': {
        'start': 'ffff00',
        'end': 'ff00ff'
      },
      'speed': {
        'start': 0,
        'end': 0
      },
      'acceleration': {
        'x': 0,
        'y': 0
      },
      'maxSpeed': 0,
      'startRotation': {
        'min': 0,
        'max': 0
      },
      'noRotation': false,
      'rotationSpeed': {
        'min': 0,
        'max': 0
      },
      'lifetime': {
        'min': 0.5,
        'max': 0.5
      },
      'blendMode': 'normal',
      'frequency': 0.008,
      'emitterLifetime': -1,
      'maxParticles': 1000,
      'pos': {
        'x': 0,
        'y': 0
      },
      'addAtBack': false,
      'spawnType': 'point'
    }
    this.emitterContainer = new PIXI.Container()
    this.emitter = new PIXI.particles.Emitter(this.emitterContainer, [texture], config)
    this.emitter.emit = true
    this.emitter.particleConstructor = PIXI.particles.Particle
  }
}

export default Sparks
