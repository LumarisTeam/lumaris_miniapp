/* eslint-disable import/first */
// jest.mock 的工厂会被提升到 const 之上，所以可变状态必须定义在工厂内部，
// 再通过模块导出的 __storage / __settings 访问。
jest.mock('@/utils/storage', () => {
  const storage: Record<string, unknown> = {}
  return {
    __storage: storage,
    STORAGE_KEYS: { TILE_CONFIGURATIONS: 'tile-configurations' },
    initializeStorage: jest.fn(),
    readStorage: (key: string, fallback: unknown) => (key in storage ? storage[key] : fallback),
    writeStorage: jest.fn(),
  }
})

jest.mock('@/stores/app', () => ({
  __settings: { visibleServices: ['electricity', 'bus', 'payment'] },
  useAppStore: {
    getState: () => ({ settings: (jest.requireMock('@/stores/app') as { __settings: unknown }).__settings }),
  },
}))

import { useTileStore } from '@/stores/tile'
import { getVisibleTiles } from '@/utils/tileConfiguration'
import type { TileConfigurationList } from '@/utils/tileConfiguration'

const storageMock = jest.requireMock('@/utils/storage') as {
  __storage: Record<string, unknown>
  writeStorage: jest.Mock
}
const appMock = jest.requireMock('@/stores/app') as { __settings: { visibleServices: string[] } }

/** 在隔离的模块注册表里重新加载 store，用来验证首次运行的迁移逻辑。 */
function loadFreshStore(): typeof useTileStore {
  let store!: typeof useTileStore
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    store = require('@/stores/tile').useTileStore
  })
  return store
}

const ALL_VISIBLE: TileConfigurationList = {
  configurations: [
    { id: 'electricity', order: 0, isVisible: true },
    { id: 'bus', order: 1, isVisible: true },
    { id: 'payment', order: 2, isVisible: true },
  ],
  lastModified: 0,
}

function visibleIds(): string[] {
  return getVisibleTiles(useTileStore.getState().config).map((tile) => tile.id)
}

describe('tile store', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    storageMock.__storage['tile-configurations'] = ALL_VISIBLE
    appMock.__settings.visibleServices = ['electricity', 'bus', 'payment']
    useTileStore.setState({ config: ALL_VISIBLE, isEditMode: false })
  })

  afterEach(() => {
    useTileStore.setState({ isEditMode: false })
    jest.useRealTimers()
  })

  test('migrates the legacy visibleServices preference on first run', () => {
    delete storageMock.__storage['tile-configurations']
    appMock.__settings.visibleServices = ['bus', 'payment']

    const store = loadFreshStore()

    expect(getVisibleTiles(store.getState().config).map((tile) => tile.id)).toEqual(['bus', 'payment'])
  })

  test('falls back to all tiles visible when the legacy preference is empty', () => {
    delete storageMock.__storage['tile-configurations']
    appMock.__settings.visibleServices = []

    expect(getVisibleTiles(loadFreshStore().getState().config)).toEqual([])
  })

  test('reads an existing configuration instead of migrating', () => {
    appMock.__settings.visibleServices = []

    expect(getVisibleTiles(loadFreshStore().getState().config).map((tile) => tile.id))
      .toEqual(['electricity', 'bus', 'payment'])
  })

  test('persists every mutation so a killed mini-program keeps the change', () => {
    useTileStore.getState().toggleVisibility('bus')

    expect(storageMock.writeStorage).toHaveBeenCalledWith(
      'tile-configurations',
      expect.objectContaining({
        configurations: expect.arrayContaining([expect.objectContaining({ id: 'bus', isVisible: false })]),
      }),
    )
  })

  test('reorders through the store', () => {
    expect(visibleIds()).toEqual(['electricity', 'bus', 'payment'])

    useTileStore.getState().move('payment', -1)
    expect(visibleIds()).toEqual(['electricity', 'payment', 'bus'])

    useTileStore.getState().move('payment', -1)
    expect(visibleIds()).toEqual(['payment', 'electricity', 'bus'])
  })

  test('hides and restores a tile through the store', () => {
    useTileStore.getState().toggleVisibility('electricity')
    expect(visibleIds()).toEqual(['bus', 'payment'])

    useTileStore.getState().toggleVisibility('electricity')
    expect(visibleIds()).toEqual(['bus', 'payment', 'electricity'])
  })

  test('resets to the default configuration', () => {
    useTileStore.getState().toggleVisibility('bus')
    useTileStore.getState().resetToDefault()

    expect(visibleIds()).toEqual(['electricity', 'bus', 'payment'])
  })

  test('toggles edit mode', () => {
    expect(useTileStore.getState().isEditMode).toBe(false)

    useTileStore.getState().toggleEditMode()
    expect(useTileStore.getState().isEditMode).toBe(true)

    useTileStore.getState().toggleEditMode()
    expect(useTileStore.getState().isEditMode).toBe(false)
  })

  test('leaves edit mode automatically after 30s of inactivity', () => {
    useTileStore.getState().toggleEditMode()

    jest.advanceTimersByTime(29_000)
    expect(useTileStore.getState().isEditMode).toBe(true)

    jest.advanceTimersByTime(1_000)
    expect(useTileStore.getState().isEditMode).toBe(false)
  })

  test('a mutation pushes the inactivity deadline back', () => {
    useTileStore.getState().toggleEditMode()

    jest.advanceTimersByTime(20_000)
    useTileStore.getState().move('bus', 1)
    jest.advanceTimersByTime(20_000)
    expect(useTileStore.getState().isEditMode).toBe(true)

    jest.advanceTimersByTime(10_000)
    expect(useTileStore.getState().isEditMode).toBe(false)
  })

  test('does not schedule an auto-exit when not editing', () => {
    useTileStore.getState().move('bus', 1)
    jest.advanceTimersByTime(60_000)

    expect(useTileStore.getState().isEditMode).toBe(false)
  })
})
