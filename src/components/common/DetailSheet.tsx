import { Text, View } from '@tarojs/components'
import { Popup } from '@nutui/nutui-react-taro'
import { AppIcon, type IconName } from '@/components/common/AppIcon'
import './detailSheet.scss'

/**
 * 详情底部弹层：标题（可带副标题）+ 若干「图标 / 标签 / 内容」信息行。
 *
 * Flutter 那边课程详情与成绩详情是同一套 ModalHeader + ModalInfoRow 结构，
 * 这里抽成一份，两个页面共用。
 */

/** 信息行图标的配色，对应各语义色的 soft 底色。 */
export type DetailRowTone = 'primary' | 'danger' | 'success' | 'warning' | 'yellow'

export interface DetailRow {
  icon: IconName
  tone: DetailRowTone
  label: string
  content: string
}

export function DetailSheet({
  title,
  subtitle,
  rows,
  visible,
  onClose,
}: {
  title: string
  subtitle?: string
  rows: DetailRow[]
  visible: boolean
  onClose: () => void
}) {
  return (
    <Popup visible={visible} position='bottom' round onClose={onClose}>
      <View className='detail-sheet'>
        <Text className='detail-sheet__title'>{title}</Text>
        {subtitle ? <Text className='detail-sheet__subtitle'>{subtitle}</Text> : null}

        <View className='detail-sheet__rows'>
          {rows.map((row) => (
            <View className='detail-sheet__row' key={row.label}>
              <View className={`detail-sheet__badge detail-sheet__badge--${row.tone}`}>
                <AppIcon name={row.icon} size={20} color={`var(--detail-accent-${row.tone})`} />
              </View>
              <View className='detail-sheet__body'>
                <Text className='detail-sheet__label'>{row.label}</Text>
                <Text className='detail-sheet__content'>{row.content || '—'}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Popup>
  )
}
