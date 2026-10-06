import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

/**
 * 界面文案必须走 t()。
 *
 * 多语言铺完之后，最容易的退化就是随手再写一句中文字面量——编译通过、测试通过，
 * 只有切到英文才看得出来。这个守卫把「源码里还有中文」变成一条会红的测试。
 *
 * 放行的两类情况：
 *   1. `*.config.ts` 是页面清单（navigationStyle 是 custom，标题由 PageShell 渲染）；
 *   2. 下面 ALLOWED 里列出的文件，理由是服务端口径、专有名词或平台清单。
 */

const SRC = resolve(__dirname, '../../src')

/** 文件 → 为什么允许它出现中文。 */
const ALLOWED: Record<string, string> = {
  'api/basic.ts': '兜底学校名是专有名词，真实值来自服务端',
  'api/client.ts': '传输层诊断信息，展示前会被 describeError 换成当前语言',
  'api/education.ts': '服务端地图分类的同名字段取值',
  'api/feedback.ts': '传输层诊断信息，展示前会被 describeError 换成当前语言',
  'app.config.ts': '小程序清单；tabBar 文案启动后由 applyLocaleToShell 覆盖',
  'stores/app.ts': '兜底学校名是专有名词',
  'subpackages/content/author/index.tsx': '团队成员昵称是专有名词，与 Flutter 的名单逐字一致',
  'subpackages/content/license/index.tsx': 'MIT 许可原文含版权人姓名',
  'subpackages/services/payment/index.tsx': '流水分类是服务端返回的中文词，不随语言切换',
  'utils/platform.ts': 'ICP 备案号',
  'utils/scheduleTime.ts': '校区名要和服务端 campusName 逐字对齐',
  'utils/education.ts': '「校区」后缀是服务端校区名的一部分',
}

const CJK = /[一-鿿]/

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(entry) ? [full] : []
  })
}

/** 去掉注释，避免把说明文档当成文案。 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:"'`])\/\/[^\n]*/gm, '$1')
}

describe('hardcoded UI copy', () => {
  test('every user-facing string lives in the localization bundle', () => {
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      const relativePath = relative(SRC, file)
      if (relativePath.startsWith('i18n/') || relativePath.endsWith('.config.ts')) continue
      if (ALLOWED[relativePath]) continue

      stripComments(readFileSync(file, 'utf8'))
        .split('\n')
        .forEach((line, index) => {
          if (CJK.test(line)) offenders.push(`${relativePath}:${index + 1}  ${line.trim().slice(0, 120)}`)
        })
    }

    expect(offenders).toEqual([])
  })

  test('the allowlist only names files that still exist', () => {
    for (const path of Object.keys(ALLOWED)) {
      expect({ path, exists: statSync(join(SRC, path)).isFile() }).toEqual({ path, exists: true })
    }
  })

  test('the allowlist itself stays documented', () => {
    const undocumented = Object.entries(ALLOWED).filter(([, reason]) => reason.trim().length < 4)
    expect(undocumented).toEqual([])
  })
})
