const COLOURS = [
  'blue',
  'red',
  'green'
]

const PATTERNS = [
  'cycle',
  'starburst'
]

class Lights {
  constructor (socket) {
    this.colours = COLOURS.map((name) => {
      return {
        label: name,
        value: name
      }
    })
    this.patterns = PATTERNS.map((name) => {
      return {
        label: name,
        value: name
      }
    })
    this.colour = null
    this.pattern = null
    this.socket = socket
  }

  nextColour () {
    let index = COLOURS.indexOf(this.colour) + 1
    if (index >= COLOURS.length) {
      index = 0
    }
    this.setColour(COLOURS[index])
  }

  prevColour () {
    let index = COLOURS.indexOf(this.colour) - 1
    if (index < 0) {
      index = COLOURS.length - 1
    }
    this.setColour(COLOURS[index])
  }

  setColour (colour) {
    this.colour = colour
  }

  nextPattern () {
    let index = PATTERNS.indexOf(this.pattern) + 1
    if (index >= PATTERNS.length) {
      index = 0
    }
    this.setPattern(PATTERNS[index])
  }

  prevPattern () {
    let index = PATTERNS.indexOf(this.pattern) - 1
    if (index < 0) {
      index = PATTERNS.length - 1
    }
    this.setPattern(PATTERNS[index])
  }

  setPattern (pattern) {
    this.pattern = pattern
  }

  update (dt) {
    this.socket.send('colour', this.colour)
    this.socket.send('pattern', this.pattern)
  }
}

export default Lights
