<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('光序 App Launch')
})

onShow(() => {
  console.log('光序 App Show')
})

onHide(() => {
  console.log('光序 App Hide')
})
</script>

<style>
@import '@/styles/global.scss';
</style>
