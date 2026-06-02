<template>
  <image
    class="lucide-icon"
    :src="svgDataUri"
    :style="iconStyle"
    mode="aspectFit"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { colorTokenMap, filledIconNames, iconMarkup } from './icons'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
    color?: string
    strokeWidth?: number
  }>(),
  {
    size: 24,
    strokeWidth: 2,
  },
)

const iconSize = computed(() => {
  const s = typeof props.size === 'number' ? props.size : parseInt(props.size)
  return `${s * 2}rpx`
})

const iconStyle = computed(() => ({
  width: iconSize.value,
  height: iconSize.value,
}))

function toBase64(value: string) {
  const buffer = new TextEncoder().encode(value)
  return uni.arrayBufferToBase64(buffer.buffer)
}

const svgDataUri = computed(() => {
  const markup = iconMarkup[props.name]
  if (!markup) return ''

  const color = colorTokenMap[props.color || ''] || props.color || '#000000'
  const fill = filledIconNames.has(props.name) ? color : 'none'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${props.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`

  return `data:image/svg+xml;base64,${toBase64(svg)}`
})
</script>

<style scoped>
.lucide-icon {
  display: inline-block;
  flex-shrink: 0;
}
</style>
