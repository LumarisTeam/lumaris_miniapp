/* eslint-disable import/first */
jest.mock('@/components/common/AppIcon', () => ({
  AppIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}))

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { HomeServiceTile } from '@/components/home/HomeServiceTile'

describe('HomeServiceTile', () => {
  test('renders Flutter-style tile content and handles presses', () => {
    const onClick = jest.fn()
    const container = document.createElement('div')
    const root = createRoot(container)

    act(() => root.render(
      <HomeServiceTile
        label='校车'
        value='今日班次'
        icon='service'
        tone='success'
        onClick={onClick}
      />,
    ))

    const tile = container.querySelector('.home-service-tile')
    expect(tile?.classList.contains('home-service-tile--success')).toBe(true)
    expect(container.textContent).toContain('校车')
    expect(container.textContent).toContain('今日班次')
    expect(container.querySelector('[data-icon="service"]')).not.toBeNull()

    act(() => tile?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(onClick).toHaveBeenCalledTimes(1)
    act(() => root.unmount())
  })
})
