import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeMode, Locale, TileConfig } from '@/types'
import { getStorage, setStorage, STORAGE_KEYS } from '@/utils/storage'

interface Settings {
  theme: ThemeMode
  locale: Locale
}

export const useSettingsStore = defineStore('settings', () => {
  const savedSettings = getStorage<Settings>(STORAGE_KEYS.SETTINGS)
  const theme = ref<ThemeMode>(savedSettings?.theme ?? 'system')
  const locale = ref<Locale>(savedSettings?.locale ?? 'zh-CN')
  const tiles = ref<TileConfig[]>(
    getStorage<TileConfig[]>(STORAGE_KEYS.TILE_CONFIGS) ?? [
      { type: 'electricity', visible: true, order: 0 },
      { type: 'bus', visible: true, order: 1 },
      { type: 'payment', visible: true, order: 2 },
    ],
  )

  function saveAll() {
    setStorage(STORAGE_KEYS.SETTINGS, { theme: theme.value, locale: locale.value })
    setStorage(STORAGE_KEYS.TILE_CONFIGS, tiles.value)
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    saveAll()
  }

  function setLocale(loc: Locale) {
    locale.value = loc
    saveAll()
  }

  function updateTiles(configs: TileConfig[]) {
    tiles.value = configs
    setStorage(STORAGE_KEYS.TILE_CONFIGS, configs)
  }

  return {
    theme,
    locale,
    tiles,
    saveAll,
    setTheme,
    setLocale,
    updateTiles,
  }
})
