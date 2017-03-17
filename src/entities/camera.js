class Camera {
  constructor (socket) {
    this.socket = socket
    this.position = [0, 0]
    this.angle = 0
    this.scale = 0.5
    this.spin = 0
    this.zoom = 0
    this.pan = 0
    this.tilt = 0
  }

  update (dt) {
    if (this.spin > 500) {
      this.spin = 500
    } else if (this.spin < -500) {
      this.spin = -500
    }
    this.angle += this.spin * 0.01 * dt
    this.spin -= this.spin * dt
    if (this.zoom > 500) {
      this.zoom = 500
    } else if (this.zoom < -500) {
      this.zoom = -500
    }
    this.scale += this.zoom * 0.01 * dt
    this.zoom -= this.zoom * dt
    if (this.scale > 10) {
      this.scale = 10
    } else if (this.scale < 0.1) {
      this.scale = 0.1
    }
    if (this.pan > 500) {
      this.pan = 500
    } else if (this.pan < -500) {
      this.pan = -500
    }
    this.position[0] += this.pan * dt
    this.pan -= this.pan * 0.5 * dt
    let width = 600 + 350 * this.scale
    if (this.position[0] > width) {
      this.position[0] = -width
    } else if (this.position[0] < -width) {
      this.position[0] = width
    }
    if (this.tilt > 500) {
      this.tilt = 500
    } else if (this.tilt < -500) {
      this.tilt = -500
    }
    this.position[1] += this.tilt * dt
    this.tilt -= this.tilt * 0.5 * dt
    let height = 1000 + 350 * this.scale
    if (this.position[1] > height) {
      this.position[1] = -height
    } else if (this.position[1] < -height) {
      this.position[1] = height
    }
  }
}

export default Camera
