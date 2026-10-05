import type { ServiceType } from '@/types/domain'
import {
  AVAILABLE_TILES,
  type TileConfigurationList,
  getVisibleTiles,
  isTileSupported,
  mergeAvailableTiles,
  moveTile,
  normalizeOrders,
  reorderTile,
  toggleVisibility,
} from '@/utils/tileConfiguration'

function configOf(entries: Array<[ServiceType, number, boolean]>): TileConfigurationList {
  return {
    configurations: entries.map(([id, order, isVisible]) => ({ id, order, isVisible })),
    lastModified: 0,
  }
}

const ALL_VISIBLE = configOf([['electricity', 0, true], ['bus', 1, true], ['payment', 2, true]])

describe('tile configuration', () => {
  test('lists only visible tiles, ordered', () => {
    const config = configOf([['payment', 0, true], ['bus', 5, true], ['electricity', 2, false]])
    expect(getVisibleTiles(config).map((tile) => tile.id)).toEqual(['payment', 'bus'])
  })

  test('hiding removes a tile from the visible list and keeps it in the config', () => {
    const next = toggleVisibility(ALL_VISIBLE, 'bus')

    expect(getVisibleTiles(next).map((tile) => tile.id)).toEqual(['electricity', 'payment'])
    expect(next.configurations.find((tile) => tile.id === 'bus')?.isVisible).toBe(false)
  })

  test('re-showing a tile appends it to the end', () => {
    const hidden = toggleVisibility(ALL_VISIBLE, 'electricity')
    const shown = toggleVisibility(hidden, 'electricity')

    expect(getVisibleTiles(shown).map((tile) => tile.id)).toEqual(['bus', 'payment', 'electricity'])
  })

  test('reorder moves a tile within the visible list and renumbers orders', () => {
    const next = reorderTile(ALL_VISIBLE, 'payment', 2, 0)

    expect(getVisibleTiles(next).map((tile) => tile.id)).toEqual(['payment', 'electricity', 'bus'])
    expect(getVisibleTiles(next).map((tile) => tile.order)).toEqual([0, 1, 2])
  })

  test('reorder ignores out-of-range indices and mismatched ids', () => {
    expect(reorderTile(ALL_VISIBLE, 'payment', 2, 9)).toBe(ALL_VISIBLE)
    expect(reorderTile(ALL_VISIBLE, 'bus', 2, 0)).toBe(ALL_VISIBLE)
    expect(reorderTile(ALL_VISIBLE, 'payment', -1, 0)).toBe(ALL_VISIBLE)
  })

  test('move steps a tile one slot and stays put at the edges', () => {
    expect(getVisibleTiles(moveTile(ALL_VISIBLE, 'bus', -1)).map((tile) => tile.id))
      .toEqual(['bus', 'electricity', 'payment'])
    expect(getVisibleTiles(moveTile(ALL_VISIBLE, 'bus', 1)).map((tile) => tile.id))
      .toEqual(['electricity', 'payment', 'bus'])

    // 已经在头上再往前移 → 原样返回
    expect(moveTile(ALL_VISIBLE, 'electricity', -1)).toBe(ALL_VISIBLE)
    expect(moveTile(ALL_VISIBLE, 'payment', 1)).toBe(ALL_VISIBLE)
  })

  test('normalizeOrders keeps hidden tiles after the visible ones', () => {
    const messy = configOf([['bus', 7, true], ['payment', 3, false], ['electricity', 9, true]])
    const next = normalizeOrders(messy)

    expect(next.configurations.map((tile) => [tile.id, tile.order])).toEqual([
      ['bus', 0],
      ['electricity', 1],
      ['payment', 3],
    ])
  })

  test('mergeAvailableTiles adds new tiles hidden and drops retired ones', () => {
    const legacy = configOf([['bus', 0, true]])
    const merged = mergeAvailableTiles(legacy)

    expect(merged.configurations.map((tile) => [tile.id, tile.isVisible])).toEqual([
      ['bus', true],
      ['electricity', false],
      ['payment', false],
    ])
  })

  test('mergeAvailableTiles returns the same object when nothing changed', () => {
    expect(mergeAvailableTiles(ALL_VISIBLE)).toBe(ALL_VISIBLE)
  })

  test('mergeAvailableTiles discards ids that are no longer offered', () => {
    const stale = {
      configurations: [
        { id: 'bus' as ServiceType, order: 0, isVisible: true },
        { id: 'retired' as ServiceType, order: 1, isVisible: true },
      ],
      lastModified: 0,
    }
    expect(mergeAvailableTiles(stale).configurations.map((tile) => tile.id))
      .toEqual(['bus', 'electricity', 'payment'])
  })

  test('isTileSupported follows the school feature flags', () => {
    expect(isTileSupported('electricity', ['electricity'])).toBe(true)
    expect(isTileSupported('bus', ['electricity'])).toBe(false)
    expect(isTileSupported('payment', ['payment', 'map'])).toBe(true)
  })

  test('offers exactly the three service tiles', () => {
    expect(AVAILABLE_TILES).toEqual(['electricity', 'bus', 'payment'])
  })
})
