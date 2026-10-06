import { filterLinkCategories, linkIconUrl } from '@/utils/links'
import type { LinkCategory } from '@/types/domain'

const categories: LinkCategory[] = [
  {
    key: 'study', name: '学习', description: null, icon: 'book', index: 1,
    links: [
      { key: 'lib', name: '图书馆', icon: 'https://cdn.example/lib.png', url: 'https://lib.xauat.edu.cn', description: '座位预约', index: 1 },
      { key: 'jw', name: '教务系统', icon: null, url: 'https://jw.xauat.edu.cn/login', description: null, index: 2 },
    ],
  },
  {
    key: 'life', name: '生活', description: null, icon: 'home', index: 2,
    links: [
      { key: 'card', name: '一卡通', icon: 'card', url: 'https://card.xauat.edu.cn', description: '充值', index: 1 },
    ],
  },
]

describe('link helpers', () => {
  test('resolves link icons the way Flutter IconUtil does', () => {
    expect(linkIconUrl({ icon: 'https://cdn.example/lib.png', url: 'https://lib.xauat.edu.cn' })).toBe('https://cdn.example/lib.png')
    expect(linkIconUrl({ icon: null, url: 'https://jw.xauat.edu.cn/login' })).toBe('https://jw.xauat.edu.cn/favicon.ico')
    // 自建图标字体的字形名在小程序里渲染不了。
    expect(linkIconUrl({ icon: 'card', url: 'https://card.xauat.edu.cn' })).toBeNull()
    expect(linkIconUrl({ icon: '', url: 'not-a-url' })).toBeNull()
  })

  test('matches a category name and keeps all of its links', () => {
    expect(filterLinkCategories(categories, '学习')[0].links).toHaveLength(2)
  })

  test('filters links by name, description and url, dropping empty categories', () => {
    expect(filterLinkCategories(categories, '充值').map((item) => item.key)).toEqual(['life'])
    expect(filterLinkCategories(categories, 'jw.xauat').map((item) => item.key)).toEqual(['study'])
    expect(filterLinkCategories(categories, '不存在')).toEqual([])
  })

  test('returns the input untouched for a blank query', () => {
    expect(filterLinkCategories(categories, '   ')).toBe(categories)
  })
})
