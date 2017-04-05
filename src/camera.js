class Camera {
  constructor (config, debug) {
    this.config = config
    this.debug = debug
    this.position = [0, 0]
    this.angle = 0
    this.scale = 0.5
    this.spin = 0
    this.zoom = 0
    this.pan = 0
    this.tilt = 0
    let angle = Math.tan((this.config.fov * 180) / Math.PI)
    this.screenCentre = [0.5 * this.config.width, 0.5 * this.config.height]
    this.scaling = [this.screenCentre[0] / angle, this.screenCentre[1] / angle]
    this.cos = 1
    this.sin = 0
    this.rcos = 1
    this.rsin = 0
  }

  worldToScreen (worldPosition, rotate) {
    if (worldPosition[2] <= 0) {
      return null
    }
    let x = (worldPosition[0] * this.scaling[0]) / worldPosition[2]
    let y = (worldPosition[1] * this.scaling[1]) / worldPosition[2]
    if (rotate) {
      return [x * this.cos - y * this.sin, x * this.sin + y * this.cos]
    } else {
      return [x, y]
    }
  }

  screenToWorld (screenPosition, worldDepth) {
    return [(screenPosition[0] * worldDepth) / this.scaling[0], (screenPosition[1] * worldDepth) / this.scaling[1], worldDepth]
  }

  update (dt) {
    if (this.spin > 1) {
      this.spin = 1
    } else if (this.spin < -1) {
      this.spin = -1
    }
    this.angle += this.spin * 3 * dt
    this.spin -= this.spin * dt
    if (this.zoom > 1) {
      this.zoom = 1
    } else if (this.zoom < -1) {
      this.zoom = -1
    }
    this.scale += this.zoom * dt
    this.zoom -= this.zoom * dt
    if (this.scale > 10) {
      this.scale = 10
    } else if (this.scale < 0.1) {
      this.scale = 0.1
    }
    if (this.pan > 1) {
      this.pan = 1
    } else if (this.pan < -1) {
      this.pan = -1
    }
    this.position[0] += this.pan * 500 * dt
    this.pan -= this.pan * dt
    let width = 600 + 350 * this.scale
    if (this.position[0] > width) {
      this.position[0] = -width
    } else if (this.position[0] < -width) {
      this.position[0] = width
    }
    if (this.tilt > 1) {
      this.tilt = 1
    } else if (this.tilt < -1) {
      this.tilt = -1
    }
    this.position[1] += this.tilt * 500 * dt
    this.tilt -= this.tilt * dt
    let height = 1000 + 350 * this.scale
    if (this.position[1] > height) {
      this.position[1] = -height
    } else if (this.position[1] < -height) {
      this.position[1] = height
    }
    this.cos = Math.cos(this.angle)
    this.rcos = Math.cos(Math.PI - this.angle)
    this.sin = Math.sin(this.angle)
    this.rsin = Math.sin(Math.PI - this.angle)
  }
}

export default Camera
