import { create } from 'zustand'
import type { ServiceType } from '@/types/domain'
import {
  AVAILABLE_TILES,
  DEFAULT_TILE_CONFIG,
  type TileConfigurationList,
  mergeAvailableTiles,
  moveTile,
  toggleVisibility,
} from '@/utils/tileConfiguration'
import { initializeStorage, readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'
import { useAppStore } from '@/stores/app'

/**
 * 首页快捷方式（磁贴）的编辑状态与持久化。
 *
 * 对应 Flutter 的 `lib/state/tile_edit_notifier.dart`：编辑模式、显示/隐藏、
 * 排序、30 秒无操作自动退出。
 */

initializeStorage()

/** 编辑模式无操作 30 秒后自动退出，与 Flutter 一致。 */
const INACTIVITY_TIMEOUT = 30_000

function isTileConfigurationList(value: unknown): value is TileConfigurationList {
  if (!value || typeof value !== 'object') return false
  const list = value as Partial<TileConfigurationList>
  return (
    Array.isArray(list.configurations) &&
    list.configurations.every(
      (tile) =>
        Boolean(tile) &&
        typeof tile.id === 'string' &&
        typeof tile.order === 'number' &&
        typeof tile.isVisible === 'boolean',
    )
  )
}

/**
 * 首次运行时把旧的「首页服务开关」迁移成磁贴配置。
 *
 * 旧设置只记了显示与否、没有顺序，所以顺序沿用 AVAILABLE_TILES。
 */
function migrateFromVisibleServices(): TileConfigurationList {
  const visibleServices = useAppStore.getState().settings.visibleServices
  return {
    configurations: AVAILABLE_TILES.map((id, index) => ({
      id,
      order: index,
      isVisible: visibleServices.includes(id),
    })),
    lastModified: Date.now(),
  }
}

function readInitialConfig(): TileConfigurationList {
  const stored = readStorage<unknown>(STORAGE_KEYS.TILE_CONFIGURATIONS, null)
  const base = isTileConfigurationList(stored) ? stored : migrateFromVisibleServices()
  return mergeAvailableTiles(base)
}

/** 定时器放在模块作用域，不进 state——它不该被持久化或被选择器比较。 */
let inactivityTimer: ReturnType<typeof setTimeout> | null = null

interface TileState {
  config: TileConfigurationList
  isEditMode: boolean
  toggleEditMode: () => void
  toggleVisibility: (tileId: ServiceType) => void
  move: (tileId: ServiceType, direction: -1 | 1) => void
  resetToDefault: () => void
}

export const useTileStore = create<TileState>((set, get) => {
  function cancelInactivityTimer(): void {
    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }
  }

  function scheduleInactivityTimer(): void {
    cancelInactivityTimer()
    if (!get().isEditMode) return
    inactivityTimer = setTimeout(() => {
      if (get().isEditMode) get().toggleEditMode()
    }, INACTIVITY_TIMEOUT)
  }

  /** 每次改动都落盘：小程序随时可能被系统回收，不能只在退出编辑模式时保存。 */
  function commit(config: TileConfigurationList): void {
    writeStorage(STORAGE_KEYS.TILE_CONFIGURATIONS, config)
    set({ config })
    scheduleInactivityTimer()
  }

  return {
    config: readInitialConfig(),
    isEditMode: false,
    toggleEditMode: () => {
      const next = !get().isEditMode
      set({ isEditMode: next })
      if (next) scheduleInactivityTimer()
      else cancelInactivityTimer()
    },
    toggleVisibility: (tileId) => commit(toggleVisibility(get().config, tileId)),
    move: (tileId, direction) => commit(moveTile(get().config, tileId, direction)),
    resetToDefault: () => {
      commit({ ...DEFAULT_TILE_CONFIG, configurations: DEFAULT_TILE_CONFIG.configurations.map((tile) => ({ ...tile })) })
    },
  }
})
