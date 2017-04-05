import Trails from './trails'

const SPEED = 2000

class Dust {
  constructor (texture) {
    this.worldRadius = 0.4
    this.worldPosition = [0, 0, 0]
    this.trails = new Trails(texture)
    this.trails.emitter.maxParticles = 0
    this.trails.emitterContainer.visible = false
  }

  update (dt, camera, debug) {
    if (!this.trails.emitterContainer.visible) {
      this._spawn(camera)
      this.trails.emitterContainer.visible = true
    }

    this.trails.emitter.update(dt)

    let dx = camera.pan * camera.rcos - camera.tilt * camera.rsin
    let dy = camera.pan * camera.rsin + camera.tilt * camera.rcos

    this.worldPosition[0] -= SPEED * dx * dt
    this.worldPosition[1] -= SPEED * dy * dt
    this.worldPosition[2] -= SPEED * camera.zoom * dt

    if (this.worldPosition[2] > 1000) {
      this.trails.emitterContainer.visible = false
      return
    } else if (this.worldPosition[2] < 1) {
      this.trails.emitterContainer.visible = false
      return
    }

    let screenPosition = camera.worldToScreen(this.worldPosition, true)

    this.trails.emitter.maxParticles = 10

    let screenRadius = camera.worldToScreen([this.worldRadius, this.worldRadius, this.worldPosition[2]])[0]

    if (screenPosition[0] > camera.screenCentre[0]) {
      this.trails.emitterContainer.visible = false
    }
    if (screenPosition[0] < -camera.screenCentre[0]) {
      this.trails.emitterContainer.visible = false
    }
    if (screenPosition[1] > camera.screenCentre[1]) {
      this.trails.emitterContainer.visible = false
    }
    if (screenPosition[1] < -camera.screenCentre[1]) {
      this.trails.emitterContainer.visible = false
    }

    let alpha = 1
    if (this.worldPosition[2] > 500) {
      alpha = Math.min(alpha, (1000 - this.worldPosition[2]) / 500)
    } else {
      alpha = Math.min(alpha, this.worldPosition[2] / 500)
    }
    if (alpha < 0) {
      alpha = 0
    }

    this.trails.emitter.updateOwnerPos(screenPosition[0], screenPosition[1])
    this.trails.emitter.startScale = screenRadius
    this.trails.emitter.endScale = screenRadius
    this.trails.emitter.startAlpha = alpha * 0.15
    this.trails.emitter.endAlpha = 0
  }

  add (world) {
    world.addChild(this.trails.emitterContainer)
  }

  remove (world) {
    world.removeChild(this.trails.emitterContainer)
  }

  _spawn (camera) {
    let dx = camera.pan * camera.rcos - camera.tilt * camera.rsin
    let dy = camera.pan * camera.rsin + camera.tilt * camera.rcos
    let screenPosition = [(Math.random() * camera.screenCentre[0] - Math.random() * camera.screenCentre[0]), (Math.random() * camera.screenCentre[1] - Math.random() * camera.screenCentre[1])]
    let worldDepth = Math.random() * 500 + 250
    worldDepth += camera.zoom * 150
    screenPosition[0] += dx * camera.screenCentre[0]
    screenPosition[1] += dy * camera.screenCentre[1]
    this.worldPosition = camera.screenToWorld(screenPosition, worldDepth)
  }
}

export default Dust
