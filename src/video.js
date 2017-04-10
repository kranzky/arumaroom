import RecordRTC from 'recordrtc'
import 'gumadapter'
import axios from 'axios'

class Video {
  constructor (socket, config) {
    this.config = config
    this.socket = socket
    this.recordAudio = null
    this.recordVideo = null
    this.tick = 0
    this.length = 6000
    window.video = this
    this.preview = document.getElementById('video')
    if (this.socket.config.connect) {
      this.socket.io.on('videos:created', (data) => {
        console.debug('video has been created')
        var video = data.video
        window.room.data.videos.unshift(video)
      })
    }
  }

  list (callback) {
    axios.get(this.config.url + '/video')
      .then(response => callback(response.data))
      .catch(error => console.log(error))
  }
  /**
   * Start Recording
   */
  record () {
    !window.stream && navigator.getUserMedia({
      audio: true,
      video: true
    }, function (stream) {
      console.log('stream added')
      window.stream = stream
      window.video.onstream()
    }, function (error) {
      alert(JSON.stringify(error, null, '\t'))
    })
    window.stream && this.onstream()
  }

  onstream () {
    console.log('on stream fce')
    this.preview.src = window.URL.createObjectURL(window.stream)
    this.preview.play()
    // this.preview.muted = true
    console.log('got new scream')
    this.timer(true)
    this.start()
  }

  start () {
    this.recordAudio = RecordRTC(window.stream, {
      onAudioProcessStarted: function () {
        window.video.recordVideo.startRecording()
      }
    })
    this.recordVideo = RecordRTC(window.stream, {
      type: 'video'
    })
    this.recordAudio.startRecording()
  }

  stop () {
    let fileName = Math.round(Math.random() * 99999999) + 99999999
    this.recordAudio.stopRecording(function () {
      console.log('got audio-blob. Getting video-blob...')
      window.video.recordVideo.stopRecording(function () {
        console.log('uploading to server...')
        window.video.webcamnOff()
        var formData = new FormData()
        formData.append('filename', fileName)
        // formData.append('audio-blob', window.video.recordAudio.getBlob())
        formData.append('video-blob', window.video.recordVideo.getBlob())
        window.video.xhr(window.video.config.url + '/video/store', formData, function (result) {
          console.log('saving video')
        })
      })
    })
  }

  xhr (url, data, callback) {
    let request = new XMLHttpRequest()
    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.status === 200) {
        callback(JSON.parse(request.responseText))
      }
    }
    request.open('POST', url)
    request.send(data)
  }
  play (video) {
    this.preview.src = video.url
    this.preview.style = 'background: url("' + video.image + '")'
    this.preview.play()
    this.preview.muted = true
  }

  timer (newone) {
    if (newone === true) {
      this.tick = 0
    } else {
      this.tick++
    }
    let display = this.length - (100 * this.tick)
    console.log('stopping in ' + display / 100 + ' ')
    if (display > 0) {
      setTimeout(function () {
        window.video.timer(false)
      }, 100)
    } else {
      console.log('finisshed')
      this.stop()
    }
  }
  webcamnOff () {
    this.preview.pause()
    this.preview.src = ''
    window.stream.getTracks()[0].stop()
    window.stream.getTracks()[1].stop()
    window.stream = false
  }
}

export default Video
