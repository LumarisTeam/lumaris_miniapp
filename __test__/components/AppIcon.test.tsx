import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ICON_NAMES, iconFontClass } from '@/components/common/AppIcon'

/**
 * 图标守卫。
 *
 * 关掉 SVG 后图标靠图标字体的类名出字形，类名对不上就会「图标不显示但点击区域
 * 还在」——`ArrowLeft` 曾被拼成 nut-icon-arrowleft，而字体里只有 arrow-left，
 * 于是返回箭头、列表右箭头、校园卡图标全空。这组测试就是为了不再悄悄退化。
 */

const ICON_FONT_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/@nutui/icons-react-taro/dist/style_iconfont.css'),
  'utf8',
)

describe('AppIcon', () => {
  test('every icon resolves to a glyph that exists in the bundled icon font', () => {
    const missing = ICON_NAMES.filter(
      (name) => !ICON_FONT_CSS.includes(`.nut-icon-${iconFontClass(name)}`),
    )

    expect(missing).toEqual([])
  })

  test('derives kebab-case class names from multi-word icon components', () => {
    expect(iconFontClass('back')).toBe('arrow-left')
    expect(iconFontClass('right')).toBe('arrow-right')
    expect(iconFontClass('card')).toBe('credit-card')
    expect(iconFontClass('settings')).toBe('setting')
    expect(iconFontClass('add')).toBe('add')
  })

  test('does not leave camelCase names in the class', () => {
    for (const name of ICON_NAMES) {
      expect(iconFontClass(name)).toBe(iconFontClass(name).toLowerCase())
      expect(iconFontClass(name)).not.toMatch(/[A-Z]/)
    }
  })

  test('covers the icon set the UI actually uses', () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(30)
    expect(ICON_NAMES).toEqual(expect.arrayContaining(['back', 'right', 'card', 'power', 'calendar']))
  })
})
