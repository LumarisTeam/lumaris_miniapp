import type { ComponentType } from 'react'
import {
  Add,
  Alarm,
  ArrowLeft,
  ArrowRight,
  Bell,
  Book,
  Calendar,
  Category,
  Check,
  Clock,
  Close,
  CreditCard,
  Del,
  Edit,
  Failure,
  Find,
  Home,
  Link,
  List,
  Notice,
  People,
  Power,
  Refresh,
  Search,
  Service,
  Setting,
  Success,
  Tips,
  User,
  Warning,
  configure,
} from '@nutui/icons-react-taro'

// SVG mask 渲染在部分小程序内核上不可靠，改用随包附带的图标字体。
configure({ useSvg: false })

export type IconName =
  | 'add' | 'alarm' | 'back' | 'right' | 'bell' | 'book' | 'calendar'
  | 'category' | 'check' | 'clock' | 'close' | 'card' | 'delete' | 'edit'
  | 'error' | 'location' | 'home' | 'link' | 'list' | 'notice' | 'people'
  | 'power' | 'refresh' | 'search' | 'service' | 'settings' | 'success' | 'tips'
  | 'user' | 'warning'

interface IconComponentProps {
  name?: string
  size?: string | number
  color?: string
  className?: string
}

interface IconDefinition {
  component: ComponentType<IconComponentProps>
  /** 图标组件原名，用来推导图标字体的类名，见 iconFontClass。 */
  source: string
}

const ICONS: Record<IconName, IconDefinition> = {
  add: { component: Add, source: 'Add' },
  alarm: { component: Alarm, source: 'Alarm' },
  back: { component: ArrowLeft, source: 'ArrowLeft' },
  right: { component: ArrowRight, source: 'ArrowRight' },
  bell: { component: Bell, source: 'Bell' },
  book: { component: Book, source: 'Book' },
  calendar: { component: Calendar, source: 'Calendar' },
  category: { component: Category, source: 'Category' },
  check: { component: Check, source: 'Check' },
  clock: { component: Clock, source: 'Clock' },
  close: { component: Close, source: 'Close' },
  card: { component: CreditCard, source: 'CreditCard' },
  delete: { component: Del, source: 'Del' },
  edit: { component: Edit, source: 'Edit' },
  error: { component: Failure, source: 'Failure' },
  location: { component: Find, source: 'Find' },
  home: { component: Home, source: 'Home' },
  link: { component: Link, source: 'Link' },
  list: { component: List, source: 'List' },
  notice: { component: Notice, source: 'Notice' },
  people: { component: People, source: 'People' },
  power: { component: Power, source: 'Power' },
  refresh: { component: Refresh, source: 'Refresh' },
  search: { component: Search, source: 'Search' },
  service: { component: Service, source: 'Service' },
  settings: { component: Setting, source: 'Setting' },
  success: { component: Success, source: 'Success' },
  tips: { component: Tips, source: 'Tips' },
  user: { component: User, source: 'User' },
  warning: { component: Warning, source: 'Warning' },
}

/**
 * 图标字体里的类名后缀（`.nut-icon-arrow-left` → `arrow-left`）。
 *
 * 关掉 SVG 后，图标模板是用 `name.toLowerCase()` 拼类名的，多词图标会被拼成
 * `nut-icon-arrowleft` 这种字体里根本不存在的名字，结果是图标不显示但点击区域
 * 还在。所以这里显式把 kebab-case 的名字传进去。
 */
export function iconFontClass(name: IconName): string {
  return ICONS[name].source.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** 所有可用图标名，供测试与外部遍历。 */
export const ICON_NAMES = Object.keys(ICONS) as IconName[]

interface AppIconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
}

export function AppIcon({ name, size = 20, color = 'currentColor', className }: AppIconProps) {
  const { component: Icon } = ICONS[name]
  return <Icon name={iconFontClass(name)} size={size} color={color} className={className} />
}
