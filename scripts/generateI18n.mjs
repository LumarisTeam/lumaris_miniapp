#!/usr/bin/env node
/**
 * 从 Flutter 版的 ARB 语言包生成小程序端的 TS 语言包。
 *
 * Flutter 的 `lib/l10n/app_*.arb` 是多语言的唯一事实来源，这里只做机械转换，
 * 不手工维护第二份文案。改完文案请在 Flutter 仓库跑一遍生成，再执行：
 *
 *   node scripts/generateI18n.mjs
 *
 * 默认从同级目录的 ios_club_app 读取，可用参数或环境变量覆盖：
 *
 *   node scripts/generateI18n.mjs --arb-dir ../ios_club_app/lib/l10n
 *   FLUTTER_L10N_DIR=/path/to/lib/l10n node scripts/generateI18n.mjs
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 小程序侧的语言代码 → Flutter ARB 文件名 */
const LOCALES = [
  { code: 'zh-CN', file: 'app_zh.arb', label: '简体中文' },
  { code: 'zh-Hant', file: 'app_zh_Hant.arb', label: '繁體中文' },
  { code: 'en', file: 'app_en.arb', label: 'English' },
  { code: 'ja', file: 'app_ja.arb', label: '日本語' },
  { code: 'ko', file: 'app_ko.arb', label: '한국어' },
  { code: 'fr', file: 'app_fr.arb', label: 'Français' },
  { code: 'de', file: 'app_de.arb', label: 'Deutsch' },
  { code: 'ru', file: 'app_ru.arb', label: 'Русский' },
]

/** 源语言：MessageKey 的联合类型由它推导。 */
const SOURCE_LOCALE = 'zh-CN'

/** 按优先级探测 ARB 目录；两个仓库不一定相邻，所以支持显式指定。 */
function resolveArbDir(argv) {
  const index = argv.indexOf('--arb-dir')
  const candidates = [
    index !== -1 ? argv[index + 1] : null,
    process.env.FLUTTER_L10N_DIR,
    // 同级目录
    '../ios_club_app/lib/l10n',
    // 本机常见布局：Project/FlutterProjects/ios_club_app
    '../../FlutterProjects/ios_club_app/lib/l10n',
  ].filter(Boolean)

  for (const candidate of candidates) {
    const dir = resolve(ROOT, candidate)
    if (existsSync(join(dir, 'app_zh.arb'))) return dir
  }

  console.error('找不到 Flutter 的 l10n 目录，请显式指定：')
  console.error('  node scripts/generateI18n.mjs --arb-dir /path/to/ios_club_app/lib/l10n')
  console.error('已尝试：')
  for (const candidate of candidates) console.error(`  ${resolve(ROOT, candidate)}`)
  process.exit(1)
}

function readMessages(arbDir, file) {
  const raw = JSON.parse(readFileSync(join(arbDir, file), 'utf8'))
  const messages = {}
  for (const key of Object.keys(raw)) {
    if (key.startsWith('@')) continue
    messages[key] = raw[key]
  }
  return messages
}

/** 生成一个语言包模块：键顺序与 ARB 一致，便于 diff。 */
function renderLocale(code, messages) {
  const body = Object.entries(messages)
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
    .join('\n')
  return `// 由 scripts/generateI18n.mjs 自动生成，请勿手工修改。
// 来源：Flutter lib/l10n ARB（语言 ${code}）
/* eslint-disable */

export const messages = {
${body}
} as const

export default messages
`
}

function main() {
  const arbDir = resolveArbDir(process.argv.slice(2))
  const outDir = join(ROOT, 'src/i18n/locales')
  mkdirSync(outDir, { recursive: true })

  const counts = new Map()
  let baseline = null

  for (const { code, file } of LOCALES) {
    let messages
    try {
      messages = readMessages(arbDir, file)
    } catch (error) {
      console.error(`读取失败 ${join(arbDir, file)}: ${error.message}`)
      process.exitCode = 1
      return
    }

    const keys = Object.keys(messages)
    if (baseline === null) {
      baseline = new Set(keys)
    } else {
      const missing = [...baseline].filter((key) => !(key in messages))
      if (missing.length > 0) {
        console.error(`${code} 缺少 ${missing.length} 个 key，例如 ${missing.slice(0, 3).join(', ')}`)
        process.exitCode = 1
        return
      }
    }

    counts.set(code, keys.length)
    writeFileSync(join(outDir, `${code}.ts`), renderLocale(code, messages))
  }

  const total = counts.get(SOURCE_LOCALE)
  console.log(`已生成 ${LOCALES.length} 个语言包，每个 ${total} 个 key → src/i18n/locales/`)
  for (const [code, count] of counts) {
    console.log(`  ${code.padEnd(8)} ${count}`)
  }
}

main()
