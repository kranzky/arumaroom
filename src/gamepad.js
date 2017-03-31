class Gamepad {
  constructor () {
    this.stick = {
      left: [0, 0],
      right: [0, 0]
    }
    this.buttons = {
      a: false,
      b: false,
      x: false,
      y: false
    }
    this.shoulder = {
      left: false,
      right: false
    }
    this.trigger = {
      left: 0,
      right: 0
    }
    this.back = false
    this.start = false
    this.dpad = {
      up: false,
      down: false,
      left: false,
      right: false
    }
  }

  scan () {
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [])
    for (var pad of gamepads) {
      if (pad) {
        this.stick.left[0] = pad.axes[0]
        this.stick.left[1] = pad.axes[1]
        this.stick.right[0] = pad.axes[2]
        this.stick.right[1] = pad.axes[3]
        this.buttons.a = pad.buttons[0].pressed
        this.buttons.b = pad.buttons[1].pressed
        this.buttons.x = pad.buttons[2].pressed
        this.buttons.y = pad.buttons[3].pressed
        this.shoulder.left = pad.buttons[4].pressed
        this.shoulder.right = pad.buttons[5].pressed
        this.trigger.left = pad.buttons[6].value
        this.trigger.right = pad.buttons[7].value
        this.back = pad.buttons[8].pressed
        this.start = pad.buttons[9].pressed
        this.dpad.up = pad.buttons[12].pressed
        this.dpad.down = pad.buttons[13].pressed
        this.dpad.left = pad.buttons[14].pressed
        this.dpad.right = pad.buttons[15].pressed
      }
    }
  }
}

export default Gamepad
