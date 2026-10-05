import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SRC = resolve(__dirname, '../../src')

function readTokens(): Set<string> {
  const scss = readFileSync(join(SRC, 'app.scss'), 'utf8')
  const pageBlock = scss.slice(scss.indexOf('page {'), scss.indexOf('.theme-dark'))
  return new Set([...pageBlock.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1]))
}

function walkScss(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walkScss(full)
    return full.endsWith('.scss') ? [full] : []
  })
}

/** Flutter ClubColors / ClubRadii 里跨端通用的那部分 token。 */
const REQUIRED_TOKENS = [
  // ClubColors 背景与描边
  '--app-bg', '--grouped-bg', '--card-bg', '--card-overlay',
  '--surface', '--surface-muted', '--surface-sunken',
  '--separator', '--border-strong', '--card-border',
  // ClubColors 文字
  '--label', '--secondary-label', '--tertiary-label', '--quaternary-label',
  '--inverse-label', '--on-accent',
  // ClubColors 语义色与 soft 变体
  '--primary', '--primary-soft', '--success', '--success-soft',
  '--warning', '--warning-soft', '--danger', '--danger-soft',
  '--indigo', '--indigo-soft', '--purple', '--purple-soft',
  '--pink', '--pink-soft', '--cyan', '--cyan-soft',
  '--yellow', '--yellow-soft',
  // ClubColors 其它
  '--selection-fill', '--shadow', '--skeleton-base', '--skeleton-highlight',
  // ClubRadii 刻度与语义别名
  '--radius-xs', '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-xxl',
  '--radius-control', '--radius-navigation', '--radius-panel', '--radius-card', '--radius-tile',
]

describe('design tokens', () => {
  const tokens = readTokens()

  test('defines every token mirrored from Flutter ClubColors and ClubRadii', () => {
    const missing = REQUIRED_TOKENS.filter((token) => !tokens.has(token))
    expect(missing).toEqual([])
  })

  test('every var(--token) used in a stylesheet is defined', () => {
    const files = walkScss(SRC)
    // 组件里自己声明的变量（如导航栏高度）也算已定义——自定义属性都在同一条
    // 级联里，跨文件引用是有意的。
    const declared = new Set(tokens)
    for (const file of files) {
      for (const match of readFileSync(file, 'utf8').matchAll(/^\s*(--[\w-]+):/gm)) {
        declared.add(match[1])
      }
    }

    const undefinedTokens = new Set<string>()
    for (const file of files) {
      const scss = readFileSync(file, 'utf8')
      for (const match of scss.matchAll(/var\((--[\w-]+)/g)) {
        if (!declared.has(match[1])) {
          undefinedTokens.add(`${match[1]} (${file.slice(SRC.length + 1)})`)
        }
      }
    }

    expect([...undefinedTokens]).toEqual([])
  })

  test('uses rpx rather than px for lengths so layouts scale per device', () => {
    const pxLengths: string[] = []

    for (const file of walkScss(SRC)) {
      const relative = file.slice(SRC.length + 1)
      if (relative === 'app.scss') continue
      for (const match of readFileSync(file, 'utf8').matchAll(/[\d.]+px/g)) {
        pxLengths.push(`${match[0]} (${relative})`)
      }
    }

    expect(pxLengths).toEqual([])
  })
})
