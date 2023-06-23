<script lang="ts">
export default {
  props: {
    stats: {
      type: Object,
      required: true
    }
  },
  computed: {
    error() {
      return (
        this.stats.tilesCount > 0x400 ||
        this.stats.paletteSize > 16 ||
        this.stats.imageW != 512 ||
        this.stats.imageH != 512
      )
    }
  }
}
</script>
<template>
  <div>
    <div v-if="error" class="notification is-danger">
      <b>Error: </b><br/>
        Detected Resolution: {{ stats.imageW }}x{{ stats.imageH }} pixels <br/>
        Required Resolution: 512x512 pixels <br/>
        Detected Number of Tiles: {{ stats.tilesCount }}<br/>
        Maximum Allowed Tiles: 1024(400h)<br/>
        Detected Number of Colors: {{ stats.paletteSize }}<br/>
        Maximum Allowed colors: 16<br/>      
    </div>
  </div>
</template>
