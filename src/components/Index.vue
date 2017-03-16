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
          <q-collapsible opened icon="camera_alt" label="Camera">
            <div class="list">
              <div class="item two-lines">
                <i class="item-primary">arrow_forward</i>
                <div class="item-content">
                  <q-range v-model="camera.pan[0]" :min="-1" :max="1"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">arrow_upward</i>
                <div class="item-content">
                  <q-range v-model="camera.pan[1]" :min="-1" :max="1"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">rotate_right</i>
                <div class="item-content">
                  <q-range v-model="camera.tilt" :min="-1" :max="1"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">zoom_out_map</i>
                <div class="item-content">
                  <q-range v-model="camera.zoom" :min="-1" :max="1"></q-range>
                </div>
              </div>
            </div>
          </q-collapsible>
          <q-collapsible icon="wb_incandescent" label="Lights">
            <div class="list">
              <div class="item two-lines">
                <i class="item-primary">color_lens</i>
                <div class="item-content">
                  <q-select type="list" v-model="lights.colour" :options="lights.colours" placeholder="Colour"></q-select>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">flare</i>
                <div class="item-content">
                  <q-select type="list" v-model="lights.pattern" :options="lights.patterns" placeholder="Pattern"></q-select>
                </div>
              </div>
            </div>
          </q-collapsible>
          <q-collapsible icon="music_note" label="Music">
            <div class="list">
              <div class="item two-lines">
                <i class="item-primary">queue_music</i>
                <div class="item-content">
                  <q-select type="list" v-model="music.track" :options="music.tracks" placeholder="Track"></q-select>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">volume_up</i>
                <div class="item-content">
                  <q-range v-model="music.volume" :min="0" :max="1"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">equalizer</i>
                <div class="item-content">
                  <q-select type="list" v-model="music.filter" :options="music.filters" placeholder="Filter"></q-select>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">whatshot</i>
                <div class="item-content">
                  <q-range v-model="music.frequency" :min="20" :max="20000"></q-range>
                </div>
              </div>
              <div class="item two-lines">
                <i class="item-primary">star</i>
                <div class="item-content">
                  <q-range v-model="music.quality" :min="0" :max="100"></q-range>
                </div>
              </div>
            </div>
          </q-collapsible>
          <q-collapsible icon="movie_filter" label="Visual">
            <div class="list">
              <div class="item two-lines">
                <i class="item-primary">looks</i>
                <div class="item-content">
                  <q-select type="list" v-model="visual.effect" :options="visual.effects" placeholder="Effect"></q-select>
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
  import Room from 'room.js'
  import { Loading } from 'quasar'

  let room = null

  export default {
    data () {
      return {
        debug: true,
        bogus: 0,
        hands: {
          left: {
            position: [-100, 200, 100],
            rotation: [0, 0, 0],
            pinch: 0,
            grab: 0,
            gesture: null
          },
          right: {
            position: [100, 200, 100],
            rotation: [0, 0, 0],
            pinch: 0,
            grab: 0,
            gesture: null
          }
        },
        camera: {
          pan: [0, 0],
          tilt: 0,
          zoom: 0
        },
        lights: {
          colours: [{
            label: 'Red',
            value: 'red'
          }, {
            label: 'Green',
            value: 'green'
          }, {
            label: 'Blue',
            value: 'blue'
          }],
          colour: null,
          patterns: [{
            label: 'Pulse',
            value: 'pulse'
          }, {
            label: 'Swipe',
            value: 'swipe'
          }],
          pattern: null
        },
        music: {
          tracks: [{
            label: 'Dubstep',
            value: 'bensound-dubstep'
          }, {
            label: 'Moose',
            value: 'bensound-moose'
          }],
          track: null,
          volume: 0.5,
          filters: [{
            label: 'Lowpass',
            value: 'lowpass'
          }, {
            label: 'Highpass',
            value: 'highpass'
          }, {
            label: 'Bandpass',
            value: 'bandpass'
          }, {
            label: 'Lowshelf',
            value: 'lowshelf'
          }, {
            label: 'Highshelf',
            value: 'highshelf'
          }, {
            label: 'Peaking',
            value: 'peaking'
          }, {
            label: 'Notch',
            value: 'notch'
          }, {
            label: 'Allpass',
            value: 'allpass'
          }],
          filter: null,
          frequency: 10000,
          quality: 0
        },
        visual: {
          effects: [{
            label: 'Hand Trails',
            value: 'trails'
          }],
          effect: null
        }
      }
    },
    methods: {
      size () {
        room.size()
      }
    },
    mounted () {
      Loading.show()
      room = new Room('viewport', this.$data)
      room.load(() => {
        Loading.hide()
        room.init()
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
</style>
