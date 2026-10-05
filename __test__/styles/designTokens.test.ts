import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const SRC = resolve(__dirname, '../../src')

function readTokens(): Set<string> {
  const scss = readFileSync(join(SRC, 'app.scss'), 'utf8')
  const pageBlock = scss.slice(scss.indexOf('page {'), scss.indexOf('.theme-dark'))
  return new Set([...pageBlock.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1]))
}

function walkFiles(dir: string, extensions: string[]): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walkFiles(full, extensions)
    return extensions.some((extension) => full.endsWith(extension)) ? [full] : []
  })
}

function walkScss(dir: string): string[] {
  return walkFiles(dir, ['.scss'])
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

  test('every stylesheet is imported, so its rules actually reach the bundle', () => {
    // 未被任何模块 import 的 .scss 不会被打包，页面会「像 CSS 没生效」一样地
    // 裸奔——scheduleGrid.scss 就这么漏过一次。
    const imported = new Set<string>()

    const record = (fromFile: string, specifier: string) => {
      // `@/x` 是 tsconfig 里的别名，映射到 src/ 根。
      const target = specifier.startsWith('@/')
        ? resolve(SRC, specifier.slice(2))
        : resolve(dirname(fromFile), specifier)
      imported.add(target)
    }

    for (const file of walkFiles(SRC, ['.ts', '.tsx'])) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/import\s+['"]([^'"]+\.scss)['"]/g)) {
        record(file, match[1])
      }
    }
    // 样式文件之间也能互相 @import。
    for (const file of walkScss(SRC)) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/@import\s+['"]([^'"]+\.scss)['"]/g)) {
        record(file, match[1])
      }
    }

    const orphans = walkScss(SRC).filter((file) => !imported.has(file))
    expect(orphans.map((file) => file.slice(SRC.length + 1))).toEqual([])
  })

  test('every class name used in JSX has a rule (or a matching family) in some stylesheet', () => {
    // 另一类静默失效：JSX 里写了类名，样式表里根本没有这条规则。放行两种合法的
    // 「查不到」情况：动态拼接的类名只校验静态前缀，以及第三方组件自带的类名。
    const ALLOWED = new Set<string>()

    const defined = new Set<string>()
    for (const file of walkScss(SRC)) {
      for (const match of readFileSync(file, 'utf8').matchAll(/\.([a-zA-Z][\w-]*)/g)) {
        defined.add(match[1])
      }
    }

    const DYNAMIC = '\u0000'
    const unresolved: string[] = []

    for (const file of walkFiles(SRC, ['.ts', '.tsx'])) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/className=(?:'([^']*)'|"([^"]*)"|\{`([^`]*)`\})/g)) {
        const raw = match[1] ?? match[2] ?? match[3] ?? ''
        const withSentinels = raw.replace(/\$\{[^}]*\}/g, DYNAMIC)

        for (const token of withSentinels.split(/\s+/).filter(Boolean)) {
          if (ALLOWED.has(token)) continue
          if (!token.includes(DYNAMIC)) {
            if (!defined.has(token)) unresolved.push(`${token} (${file.slice(SRC.length + 1)})`)
            continue
          }
          // 动态拼接：至少要有一个已定义的类名以静态前缀开头。
          const prefix = token.slice(0, token.indexOf(DYNAMIC))
          if (prefix && ![...defined].some((name) => name.startsWith(prefix))) {
            unresolved.push(`${token.replace(DYNAMIC, '…')} (${file.slice(SRC.length + 1)})`)
          }
        }
      }
    }

    expect(unresolved).toEqual([])
  })

  test('uses rpx rather than px for lengths so layouts scale per device', () => {
    const pxLengths: string[] = []

    for (const file of walkScss(SRC)) {
      const relative = file.slice(SRC.length + 1)
      if (relative === 'app.scss') continue

      // 媒体查询断点是设备宽度阈值，本来就该用 px——用 rpx 会随屏宽换算，反而错。
      const scss = readFileSync(file, 'utf8').replace(/@media[^{]*\{/g, '@media {')
      for (const match of scss.matchAll(/[\d.]+px/g)) {
        pxLengths.push(`${match[0]} (${relative})`)
      }
    }

    expect(pxLengths).toEqual([])
  })
})
