<script lang="ts">
import VueResizable from '@/components/Resizable.vue'

export default {
  components: {
    VueResizable
  },
  setup() {
    // expose to template and other options API hooks
    return {}
  },

  props: {
    area: {
      type: Object,
      required: true
    },
    minWidth: {
      default: 16,
      type: Number
    },
    maxWidth: {
      default: 512,
      type: Number
    },
    minHeight: {
      default: 16,
      type: Number
    },
    maxHeight: {
      default: 512,
      type: Number
    },
    active: Boolean
  },

  emits: ['update'],
  data() {
    const area_rs = {
      width: this.area?.w || 16,
      height: this.area?.h || 16,
      left: this.area?.x,
      top: this.area?.y,
      fitParent: true
    }
    return {
      area_rs
    }
  },
  computed: {
    ractive() {
      return this.active ? ['r', 'rb', 'b', 'lb', 'l', 'lt', 't', 'rt'] : []
    },
    dragOnly() {
      return this.maxWidth == this.minWidth && this.maxHeight == this.minHeight
    }
  },
  methods: {
    eHandler(data: any) {
      const o = Object.assign({}, this.area)
      o.h = data.height
      o.w = data.width
      o.x = data.left
      o.y = data.top
      this.$emit('update', o)
    }
  },
  mounted() {}
}
</script>

<template>
  <VueResizable
    class="vue-resizable"
    :class="{ 'drag-only': dragOnly }"
    v-bind="area_rs"
    @resize:end="eHandler"
    @drag:end="eHandler"
    :active="ractive"
    :min-height="minHeight"
    :max-height="maxHeight"
    :max-width="maxWidth"
    :min-width="minWidth"
    :drag-selector="'.resizable-content'"
  >
    <div class="resizable-content" :class="{ active: active }">
      <slot></slot>
    </div>
  </VueResizable>
</template>
<style lang="scss">
.vue-resizable.drag-only {
  .resizable-r,
  .resizable-l,
  .resizable-b,
  .resizable-b,
  .resizable-rb,
  .resizable-lb,
  .resizable-rt,
  .resizable-lt,
  .resizable-t,
  .resizable-t {
    display: none;
    cursor: none;
  }
}

.resizable-content {
  height: 100%;
  width: 100%;
  display: block;
  //position: relative;
  cursor: pointer;
  &.active {
    //&::before {
    //content: ' ';
    //background-color: aqua;
    //opacity: 0.2;
    outline: 1px solid #555;
    //position: absolute;
    //}
  }
}
</style>
