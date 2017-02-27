<template>
  <q-layout>
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
