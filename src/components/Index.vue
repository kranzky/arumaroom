<template>
  <q-layout>
    <div slot="header" class="toolbar">
      <button class="hide-on-drawer-visible" @click="$refs.preferences.open()">
        <i>menu</i>
      </button>
      <q-toolbar-title :padding="1">
        ArumaRoom Prototype
      </q-toolbar-title>
    </div>
    <q-drawer ref="preferences">
    </q-drawer>
    <div class="layout-view">
      <canvas id="viewport"></canvas>
    </div>
  </q-layout>
</template>

<script>
  import Room from 'room.js'
  import { Loading } from 'quasar'

  let room = null

  export default {
    data () {
      return {
        debug: false,
        hands: true,
        music: false
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
