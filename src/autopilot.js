class Autopilot {
  constructor () {
    this.stick = {
      left: [0, 0],
      right: [0, 0]
    }
    this.hand = {
      left: [0, 0],
      right: [0, 0]
    }
    this.time = 0
    this.room = 0
    this.click = false
    this.enabled = false
  }

  update (dt) {
    if (!this.enabled) {
      this.time = 0
      return
    }
    if (this.time === 0) {
      this.room = 30 + Math.random() * 90
    }
    this.time += dt
    this.stick.left[0] = 0.1 * Math.sin(this.time / 17)
    this.stick.left[1] = 3 * Math.sin(this.time / 29 + 0.5 * Math.PI) - 3
    this.stick.right[0] = 0.2 * Math.sin(this.time / 13)
    this.stick.right[1] = 0.2 * Math.sin(this.time / 11)
    this.hand.left[0] = Math.sin(this.time * 0.3 * 2) * 2 * Math.sin(this.time / 11)
    this.hand.left[1] = Math.cos(this.time * 1.1 * 2) * 2 * Math.sin(this.time / 3)
    this.hand.right[0] = Math.sin(this.time * 0.7 * 2) * 2 * Math.sin(this.time / 5)
    this.hand.right[1] = Math.cos(this.time * 0.5 * 2) * 2 * Math.sin(this.time / 7)
    this.room -= dt
    if (this.room < 0) {
      this.click = true
      this.room = 30 + Math.random() * 570
    } else {
      this.click = false
    }
  }
}

export default Autopilot
