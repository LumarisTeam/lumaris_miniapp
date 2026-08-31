import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Text } from '@tarojs/components'
import { ClubCard } from '@/components/common/ClubCard'

describe('ClubCard', () => {
  test('renders content and handles presses', () => {
    const onClick = jest.fn()
    const container = document.createElement('div')
    const root = createRoot(container)

    act(() => root.render(React.createElement(ClubCard, { onClick }, React.createElement(Text, null, '课程卡片'))))
    expect(container.textContent).toContain('课程卡片')
    act(() => container.querySelector('span')?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(onClick).toHaveBeenCalledTimes(1)
    act(() => root.unmount())
  })
})
