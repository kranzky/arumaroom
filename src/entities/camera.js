class Camera {
  constructor () {
    this.position = [0, 0]
    this.angle = 0
    this.scale = 0.5
    this.spin = 0
    this.zoom = 0
    this.pan = 0
    this.tilt = 0
  }

  update (dt) {
    if (this.spin > 1) {
      this.spin = 1
    } else if (this.spin < -1) {
      this.spin = -1
    }
    this.angle += this.spin * 10 * dt
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
  }
}

export default Camera
