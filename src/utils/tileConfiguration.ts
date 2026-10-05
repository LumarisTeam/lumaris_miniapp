import type { Feature, ServiceType } from '@/types/domain'

/**
 * 首页快捷方式（磁贴）的显示与排序配置。
 *
 * 语义对齐 Flutter 的 `lib/core/models/tile_configuration.dart`：
 * 只有 isVisible 的磁贴会出现在首页，按 order 升序排列；隐藏的磁贴保留在
 * 配置里（order 可能过期），重新显示时排到末尾。
 *
 * 与 Flutter 的差异：磁贴 id 用稳定的 ASCII 标识（也是 ServiceType 的值），
 * 不用「电费」这类会随文案变化的字符串当持久化键。
 */

/** 所有可用的磁贴，顺序即新装用户的默认排列。 */
export const AVAILABLE_TILES: ServiceType[] = ['electricity', 'bus', 'payment']

/** 默认全部显示。 */
export const DEFAULT_TILE_CONFIG: TileConfigurationList = {
  configurations: AVAILABLE_TILES.map((id, index) => ({ id, order: index, isVisible: true })),
  lastModified: 0,
}

/** 磁贴对应的学校功能开关，用来过滤掉该学校不支持的服务。 */
export const TILE_FEATURE: Record<ServiceType, Feature> = {
  electricity: 'electricity',
  bus: 'bus_schedule',
  payment: 'payment',
}

export function isTileSupported(tileId: ServiceType, features: Feature[]): boolean {
  return features.includes(TILE_FEATURE[tileId])
}

export interface TileConfiguration {
  id: ServiceType
  order: number
  isVisible: boolean
}

export interface TileConfigurationList {
  configurations: TileConfiguration[]
  lastModified: number
}

/** 可见磁贴，按 order 升序。 */
export function getVisibleTiles(config: TileConfigurationList): TileConfiguration[] {
  return config.configurations
    .filter((tile) => tile.isVisible)
    .sort((left, right) => left.order - right.order)
}

/** 把可见磁贴的 order 重排成 0..n-1，隐藏的排在后面。 */
export function normalizeOrders(config: TileConfigurationList): TileConfigurationList {
  const visible = getVisibleTiles(config).map((tile, index) => ({ ...tile, order: index }))
  const hidden = config.configurations.filter((tile) => !tile.isVisible)
  return { configurations: [...visible, ...hidden], lastModified: Date.now() }
}

function isKnownTile(id: string): id is ServiceType {
  return (AVAILABLE_TILES as string[]).includes(id)
}

/**
 * 补齐配置里缺失的可用磁贴（新版本新增的磁贴默认隐藏），并剔除已经下线的。
 *
 * 对应 Flutter `TileEditNotifier._loadConfiguration` 里的合并逻辑。
 */
export function mergeAvailableTiles(config: TileConfigurationList): TileConfigurationList {
  const known = config.configurations.filter((tile) => isKnownTile(tile.id))
  const existing = new Set(known.map((tile) => tile.id))
  const appended = AVAILABLE_TILES
    .filter((id) => !existing.has(id))
    .map((id, index) => ({ id, order: known.length + index, isVisible: false }))

  const configurations = [...known, ...appended]
  if (
    configurations.length === config.configurations.length &&
    configurations.every((tile, index) => tile === config.configurations[index])
  ) {
    return config
  }
  return { configurations, lastModified: Date.now() }
}

/**
 * 把 [tileId] 从 [oldIndex] 移到 [newIndex]（索引都相对**可见磁贴列表**）。
 *
 * 越界或 id 与位置不符时返回原配置，不抛异常——小程序里拖拽/点击的边界情况
 * 比 Flutter 多，静默忽略比中断交互更合适。
 */
export function reorderTile(
  config: TileConfigurationList,
  tileId: ServiceType,
  oldIndex: number,
  newIndex: number,
): TileConfigurationList {
  const visible = getVisibleTiles(config)
  if (
    oldIndex < 0 || oldIndex >= visible.length ||
    newIndex < 0 || newIndex >= visible.length ||
    visible[oldIndex].id !== tileId
  ) {
    return config
  }

  const moved = [...visible]
  const [tile] = moved.splice(oldIndex, 1)
  moved.splice(newIndex, 0, tile)

  const hidden = config.configurations.filter((item) => !item.isVisible)
  return {
    configurations: [
      ...moved.map((item, index) => ({ ...item, order: index })),
      ...hidden,
    ],
    lastModified: Date.now(),
  }
}

/** 交换两个可见位置，供界面的「前移/后移」按钮使用。 */
export function moveTile(
  config: TileConfigurationList,
  tileId: ServiceType,
  direction: -1 | 1,
): TileConfigurationList {
  const index = getVisibleTiles(config).findIndex((tile) => tile.id === tileId)
  if (index === -1) return config
  return reorderTile(config, tileId, index, index + direction)
}

/** 显示/隐藏一个磁贴；重新显示时排到末尾。 */
export function toggleVisibility(
  config: TileConfigurationList,
  tileId: ServiceType,
): TileConfigurationList {
  const index = config.configurations.findIndex((tile) => tile.id === tileId)
  if (index === -1) return config

  const tile = config.configurations[index]
  if (tile.isVisible) {
    // 隐藏：order 留着不管，normalizeOrders 只重排可见的那些。
    const configurations = [...config.configurations]
    configurations[index] = { ...tile, isVisible: false }
    return normalizeOrders({ configurations, lastModified: Date.now() })
  }

  const visibleCount = config.configurations.filter((item) => item.isVisible).length
  const configurations = [...config.configurations]
  configurations[index] = { ...tile, isVisible: true, order: visibleCount }
  return normalizeOrders({ configurations, lastModified: Date.now() })
}
