import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Locale, TileConfig } from '@/types'
import { getStorage, setStorage, STORAGE_KEYS } from '@/utils/storage'

interface Settings {
  locale: Locale
}

const DEFAULT_TILES: TileConfig[] = [
  { type: 'electricity', visible: true, order: 0 },
  { type: 'bus', visible: true, order: 1 },
  { type: 'payment', visible: true, order: 2 },
]

function isTileConfig(value: unknown): value is TileConfig {
  if (!value || typeof value !== 'object') {
    return false
  }

  const tile = value as Partial<TileConfig>
  return typeof tile.type === 'string' && typeof tile.visible === 'boolean' && typeof tile.order === 'number'
}

function normalizeTiles(value: unknown): TileConfig[] {
  if (!Array.isArray(value)) {
    return DEFAULT_TILES
  }

  const tiles = value.filter(isTileConfig)
  return tiles.length > 0 ? tiles : DEFAULT_TILES
}

export const useSettingsStore = defineStore('settings', () => {
  const savedSettings = getStorage<Settings>(STORAGE_KEYS.SETTINGS)
  const locale = ref<Locale>(savedSettings?.locale ?? 'zh-CN')
  const tiles = ref<TileConfig[]>(normalizeTiles(getStorage<unknown>(STORAGE_KEYS.TILE_CONFIGS)))

  function saveAll() {
    setStorage(STORAGE_KEYS.SETTINGS, { locale: locale.value })
    setStorage(STORAGE_KEYS.TILE_CONFIGS, tiles.value)
  }

  function setLocale(loc: Locale) {
    locale.value = loc
    saveAll()
  }

  function updateTiles(configs: TileConfig[]) {
    tiles.value = normalizeTiles(configs)
    setStorage(STORAGE_KEYS.TILE_CONFIGS, tiles.value)
  }

  return {
    locale,
    tiles,
    saveAll,
    setLocale,
    updateTiles,
  }
})
