import type { LinkCategory, LinkItem } from '@/types/domain'

/**
 * 校园导航的分类/关键词过滤。
 *
 * 对应 Flutter `link_page.dart` 的展示结构（分类卡片 + 网格）。Flutter 没有搜索
 * 框，这里保留小程序原有的搜索：关键词命中分类名、链接名或描述都算。
 */
export function filterLinkCategories(categories: LinkCategory[], query: string): LinkCategory[] {
  const keyword = query.trim().toLowerCase()
  if (!keyword) return categories

  return categories
    .map((category) => {
      if (category.name.toLowerCase().includes(keyword)) return category
      return {
        ...category,
        links: category.links.filter((link) =>
          `${link.name} ${link.description ?? ''} ${link.url}`.toLowerCase().includes(keyword)),
      }
    })
    .filter((category) => category.links.length > 0)
}

/**
 * 链接图标地址。
 *
 * 对应 Flutter `IconUtil.getIconFont`：`icon` 是 http 地址时直接用；为空时退回站点
 * 的 favicon；其余情况是自建图标字体的字形名，小程序里渲染不了，交给调用方显示
 * 占位图标。
 */
export function linkIconUrl(link: Pick<LinkItem, 'icon' | 'url'>): string | null {
  const icon = (link.icon ?? '').trim()
  if (icon.startsWith('http')) return icon
  if (icon) return null

  const match = /^https?:\/\/([^/?#]+)/i.exec(link.url.trim())
  return match ? `https://${match[1]}/favicon.ico` : null
}
