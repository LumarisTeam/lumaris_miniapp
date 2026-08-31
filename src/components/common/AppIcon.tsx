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
  Refresh,
  Search,
  Service,
  Setting,
  Success,
  Tips,
  User,
  Warning,
} from '@nutui/icons-react-taro'

export type IconName =
  | 'add' | 'alarm' | 'back' | 'right' | 'bell' | 'book' | 'calendar'
  | 'category' | 'check' | 'clock' | 'close' | 'card' | 'delete' | 'edit'
  | 'error' | 'location' | 'home' | 'link' | 'list' | 'notice' | 'people'
  | 'refresh' | 'search' | 'service' | 'settings' | 'success' | 'tips'
  | 'user' | 'warning'

const ICONS: Record<IconName, ComponentType<{ size?: string | number; color?: string; className?: string }>> = {
  add: Add,
  alarm: Alarm,
  back: ArrowLeft,
  right: ArrowRight,
  bell: Bell,
  book: Book,
  calendar: Calendar,
  category: Category,
  check: Check,
  clock: Clock,
  close: Close,
  card: CreditCard,
  delete: Del,
  edit: Edit,
  error: Failure,
  location: Find,
  home: Home,
  link: Link,
  list: List,
  notice: Notice,
  people: People,
  refresh: Refresh,
  search: Search,
  service: Service,
  settings: Setting,
  success: Success,
  tips: Tips,
  user: User,
  warning: Warning,
}

interface AppIconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
}

export function AppIcon({ name, size = 20, color = 'currentColor', className }: AppIconProps) {
  const Icon = ICONS[name]
  return <Icon size={size} color={color} className={className} />
}
