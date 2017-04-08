<template>
  <q-layout>
    <div slot="header" class="toolbar" v-show="debug">
      <button class="hide-on-drawer-visible" @click="$refs.leftDrawer.open()">
        <i>menu</i>
      </button>
      <q-toolbar-title class="text-center">
        Arumaroom
      </q-toolbar-title>
      <button class="hide-on-drawer-visible" @click="$refs.rightDrawer.open()">
        <i>menu</i>
      </button>
    </div>
    <q-drawer ref="leftDrawer" v-show="debug">
      <div class="toolbar light">
        <q-toolbar-title>
          Inputs
        </q-toolbar-title>
      </div>
      <div class="card">
        <div class="list item-delimiter">
          <q-collapsible opened icon="thumb_down" label="Left Hand">
            <div>
              <dl>
                <dt>Position</dt>
                <dd>{{ hands.left.position.map(num => num.toFixed(1)).join(', ') }}</dd>
              </dl>
              <dl>
                <dt>Rotation</dt>
                <dd>{{ hands.left.rotation.map(num => num.toFixed(2)).join(', ') }}</dd>
              </dl>
              <dl>
                <dt>Pinch</dt>
                <dd>{{ hands.left.pinch.toFixed(2) }}</dd>
              </dl>
              <dl>
                <dt>Grab</dt>
                <dd>{{ hands.left.grab.toFixed(2) }}</dd>
              </dl>
              <dl>
                <dt>Gesture</dt>
                <dd>{{ hands.left.gesture || '-' }}</dd>
              </dl>
            </div>
          </q-collapsible>
          <q-collapsible opened icon="thumb_up" label="Right Hand">
            <div>
              <dl>
                <dt>Position</dt>
                <dd>{{ hands.right.position.map(num => num.toFixed(1)).join(', ') }}</dd>
              </dl>
              <dl>
                <dt>Rotation</dt>
                <dd>{{ hands.right.rotation.map(num => num.toFixed(2)).join(', ') }}</dd>
              </dl>
              <dl>
                <dt>Pinch</dt>
                <dd>{{ hands.right.pinch.toFixed(2) }}</dd>
              </dl>
              <dl>
                <dt>Grab</dt>
                <dd>{{ hands.right.grab.toFixed(2) }}</dd>
              </dl>
              <dl>
                <dt>Gesture</dt>
                <dd>{{ hands.right.gesture || '-' }}</dd>
              </dl>
            </div>
          </q-collapsible>
          <q-collapsible opened icon="videogame_asset" label="Game Pad">
            <div>
              <dl>
                <dt>Left Stick</dt>
                <dd>{{ pad.sticks.left.map(num => num.toFixed(2)).join(', ') }}</dd>
              </dl>
              <dl>
                <dt>Right Stick</dt>
                <dd>{{ pad.sticks.right.map(num => num.toFixed(2)).join(', ') }}</dd>
              </dl>
              <dl>
                <dt>Triggers</dt>
                <dd>{{ pad.triggers.left.toFixed(2) }}, {{ pad.triggers.right.toFixed(2) }}</dd>
              </dl>
              <dl>
                <dt>Buttons</dt>
                <dd>{{ pad.buttons.length == 0 ? '-' : pad.buttons.join(', ') }}</dd>
              </dl>
            </div>
          </q-collapsible>
        </div>
      </div>
    </q-drawer>
    <div class="layout-view">
      <canvas id="viewport"></canvas>
    </div>
    <q-drawer right-side ref="rightDrawer" v-show="debug">
      <div class="toolbar light">
        <q-toolbar-title>
          Actions
        </q-toolbar-title>
      </div>
      <div class="card">
        <div class="list item-delimiter">
          <q-collapsible opened icon="terrain" label="Room">
            <div class="list">
              <div class="item two-lines">
                <i class="item-primary">place</i>
                <div class="item-content">
                  <q-select type="list" v-model="name" @input="teleport" :options="rooms" placeholder="Room"></q-select>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">highlight</i>
                <div class="item-content">
                  <q-range v-model="magic" @input="spell" :min="0" :max="1000"></q-range>
                </div>
              </div>
            </div>
          </q-collapsible>
          <q-collapsible opened icon="music_note" label="Music">
            <div class="list">
              <div class="item two-lines">
                <i class="item-primary">queue_music</i>
                <div class="item-content">
                  <q-select type="list" v-model="music.track" @input="track" :options="music.tracks" placeholder="Track"></q-select>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">volume_up</i>
                <div class="item-content">
                  <q-range v-model="music.volume" @input="volume" :min="0" :max="1000"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">equalizer</i>
                <div class="item-content">
                  <q-range v-model="music.frequency" @input="frequency" :min="0" :max="1000"></q-range>
                </div>
              </div>
            </div>
          </q-collapsible>
          <q-collapsible opened icon="camera_alt" label="Camera">
            <div class="list">
              <div class="item two-lines">
                <i class="item-primary">arrow_forward</i>
                <div class="item-content">
                  <q-range v-model="camera.pan" @input="pan" :min="-500" :max="500"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">arrow_upward</i>
                <div class="item-content">
                  <q-range v-model="camera.tilt" @input="tilt" :min="-500" :max="500"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">rotate_right</i>
                <div class="item-content">
                  <q-range v-model="camera.spin" @input="spin" :min="-500" :max="500"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">zoom_out_map</i>
                <div class="item-content">
                  <q-range v-model="camera.zoom" @input="zoom" :min="-500" :max="500"></q-range>
                </div>
              </div>
            </div>
          </q-collapsible>
        </div>
      </div>
    </q-drawer>
  </q-layout>
</template>

<script>
  import { Loading } from 'quasar'
  import Vue from 'vue'
  import Room from 'room.js'

  let room = null

  export default {
    data () {
      return {
        debug: true,
        hands: {
          left: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            pinch: 0,
            grab: 0,
            gesture: null
          },
          right: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            pinch: 0,
            grab: 0,
            gesture: null
          }
        },
        pad: {
          sticks: {
            left: [0, 0],
            right: [0, 0]
          },
          triggers: {
            left: 0,
            right: 0
          },
          buttons: []
        },
        rooms: [],
        name: null,
        magic: 0,
        camera: {
          pan: 0,
          tilt: 0,
          zoom: 0,
          spin: 0
        },
        music: {
          tracks: [],
          track: null,
          volume: 0,
          frequency: 0
        }
      }
    },
    watch: {
      debug: function (value) {
        this.size()
      }
    },
    methods: {
      size () {
        if (room) {
          Vue.nextTick(() => {
            room.size()
          })
        }
      },
      teleport (value) { if (room) { room.setRoom(value) } },
      spell (value) { if (room) { room.magic = value / 1000 } },
      pan (value) { if (room) { room.camera.pan = value / 500 } },
      tilt (value) { if (room) { room.camera.tilt = value / 500 } },
      spin (value) { if (room) { room.camera.spin = value / 500 } },
      zoom (value) { if (room) { room.camera.zoom = value / 500 } },
      volume (value) { if (room) { room.jockey.volume = value / 1000 } },
      track (value) { if (room) { room.jockey.setTrack(value) } },
      frequency (value) { if (room) { room.jockey.frequency = value / 1000 } }
    },
    mounted () {
      Loading.show()
      room = new Room('viewport')
      room.init(this.$data)
      room.load(() => {
        Loading.hide()
        room.run()
        window.addEventListener('resize', this.size)
      })
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.size)
      room.fini()
    }
  }
</script>

<style lang="styl">
  #viewport
    background-color red
    margin 0
    width 100%
    height 100%
  .layout-view
    cursor none
</style>
