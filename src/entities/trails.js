/* global PIXI */
import 'pixi.js'
import 'pixi-particles'

class Trails {
  constructor (texture) {
    let config = {
      'alpha': {
        'start': 0.4,
        'end': 0.0
      },
      'color': {
        'start': 'ffffff',
        'end': '333333'
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
      'noRotation': true,
      'rotationSpeed': {
        'min': 0,
        'max': 0
      },
      'lifetime': {
        'min': 0.1,
        'max': 0.1
      },
      'blendMode': 'normal',
      'frequency': 0.01,
      'emitterLifetime': -1,
      'maxParticles': 0,
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

export default Trails
