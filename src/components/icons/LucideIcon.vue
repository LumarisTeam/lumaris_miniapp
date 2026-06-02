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

const colorTokenMap: Record<string, string> = {
  'var(--color-primary)': '#007aff',
  'var(--color-secondary-label)': '#3c3c4399',
  'var(--color-tertiary-label)': '#3c3c434d',
  'var(--color-label)': '#000000',
  'var(--color-on-accent)': '#ffffff',
  'var(--color-danger)': '#ff3b30',
}

const iconPaths: Record<string, string> = {
  house: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  'calendar-days':
    'M8 2v4 M16 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01 M8 18h.01 M12 18h.01 M16 18h.01',
  'graduation-cap':
    'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z M22 10v6 M6 12.5V16a6 3 0 0 0 12 0v-3.5',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  'log-in':
    'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4 M10 17l5-5-5-5 M15 12H3',
  'log-out':
    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  settings:
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  bus: 'M8 6v6 M15 6v6 M2 12h20 M6 2h12a4 4 0 0 1 4 4v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a4 4 0 0 1 4-4z M8 18h.01 M16 18h.01',
  'bolt-electric':
    'M13 2L3 14h9l-1 8 10-12h-9l1-8z M6 22h12a4 4 0 0 0 4-4V8',
  'credit-card':
    'M2 10h20 M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z',
  map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16',
  'map-pin':
    'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z M12 7v6 M9 10h6',
  wifi: 'M12 20h.01 M2 8.82a15 15 0 0 1 20 0 M5 12.859a10 10 0 0 1 14 0 M8.5 16.429a5 5 0 0 1 7 0',
  'book-open':
    'M12 7v14 M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-9a1 1 0 0 0-1 1z M7.21 15H2.79a1 1 0 0 0-.79.84V20a1 1 0 0 0 2 0v-4.16a1 1 0 0 1 .79-.84z M17.21 15h4.42a1 1 0 0 1 .79.84V20a1 1 0 0 1-2 0v-4.16a1 1 0 0 0-.79-.84z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  info: 'M12 16v-4 M12 8h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  'arrow-left':
    'M12 19l-7-7 7-7 M19 12H5',
  'chevron-right':
    'M9 18l6-6-6-6',
  'chevron-left':
    'M15 18l-6-6 6-6',
  plus: 'M5 12h14 M12 5v14',
  minus: 'M5 12h14',
  x: 'M18 6L6 18 M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  'alert-circle':
    'M12 8v4 M12 16h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  'refresh-cw':
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8 M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16 M21 3v5h-5 M3 21v-5h5',
  search: 'M21 21l-4.3-4.3 M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
  'more-horizontal':
    'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  clock: 'M12 6v6l4 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  'map-pin-house':
    'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M15 7l-3-3-3 3',
  sun: 'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41 M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  'globe-lock':
    'M15.686 15A14.5 14.5 0 0 1 12 22a14.5 14.5 0 0 1 0-20 10 10 0 1 0 9.825 13 M22 16a1 1 0 0 0-2 0v2h2z M19 18v-3a2 2 0 0 1 4 0v3 M22 18h-6',
  'shield-check':
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.06 1.06 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z M9 12l2 2 4-4',
  'file-text':
    'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z M14 2v4a2 2 0 0 0 2 2h4 M10 9H8 M16 13H8 M14 17H8',
  'user-check':
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M16 11l2 2 4-4',
  'school-building':
    'M14 22v-4a2 2 0 0 0-4 0v4 M6 10h3 M11 5h3 M17 10h3 M22 22H2 M4 22V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16',
  'star-filled':
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  palette: 'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1 5-5 M12 6v.01',
  'eye-off':
    'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.744 10.744 0 0 1-1.444 2.49 M14.084 14.158a3 3 0 0 1-4.242-4.242 M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143 M2 2l20 20',
  'sparkles-line':
    'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z M20 3v4 M22 5h-4 M4 17v2 M5 18H3',
  layout: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M9 3v18 M3 9h18',
  'circle-help':
    'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  pencil: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z M15 5l4 4',
  trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
  'external-link':
    'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
  'download-cloud':
    'M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24 M12 12v9 M8 17l4 4 4-4',
  'ticket-check':
    'M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 0-2 2v.01 M2 15v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4 M2 15a2 2 0 0 0 2-2v-.01 M22 15a2 2 0 0 1-2-2v-.01 M9 12l2 2 4-4',
  'building-2':
    'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4',
  'file-lock':
    'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z M14 2v4a2 2 0 0 0 2 2h4 M17 13h-2v-1.5a1.5 1.5 0 0 1 3 0V13 M15 13v3h4v-3',
  'notebook-pen':
    'M13.4 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8 M2 6h4 M2 10h4 M2 14h4 M2 18h4 M14 2v4a2 2 0 0 0 2 2h4 M15 18l3-3 3 3 M18 15v7',
  clipboard:
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
  inbox:
    'M22 12h-6l-2 3H10l-2-3H2 M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
}

function toBase64(value: string) {
  const buffer = new TextEncoder().encode(value)
  return uni.arrayBufferToBase64(buffer.buffer)
}

const svgDataUri = computed(() => {
  const paths = iconPaths[props.name]
  if (!paths) return ''

  const color = colorTokenMap[props.color || ''] || props.color || '#000000'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${props.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths
    .split(/\s+(?=M\d)/)
    .map((d) => `<path d="${d}"/>`)
    .join('')}</svg>`

  return `data:image/svg+xml;base64,${toBase64(svg)}`
})
</script>

<style scoped>
.lucide-icon {
  display: inline-block;
  flex-shrink: 0;
}
</style>
