import type { PropsWithChildren } from 'react'
import { Switch, Text, View } from '@tarojs/components'
import { Popup } from '@nutui/nutui-react-taro'
import './settingSheet.scss'

/**
 * 页面设置弹层。
 *
 * Flutter 的校车、电费、饭卡页都用同一个「标题 + 若干开关行」的底部弹层
 * （`showClubModalBottomSheet` + `ClubListTile` + `CupertinoSwitch`），这里抽成
 * 一份共用。
 */
export function SettingSheet({
  title,
  visible,
  onClose,
  children,
}: PropsWithChildren<{ title: string; visible: boolean; onClose: () => void }>) {
  return (
    <Popup visible={visible} position='bottom' round onClose={onClose}>
      <View className='setting-sheet'>
        <Text className='setting-sheet__title'>{title}</Text>
        {children}
      </View>
    </Popup>
  )
}

export function SettingSwitchRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string
  subtitle?: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <View className='setting-sheet__row'>
      <View className='setting-sheet__text'>
        <Text className='setting-sheet__label'>{title}</Text>
        {subtitle ? <Text className='setting-sheet__subtitle'>{subtitle}</Text> : null}
      </View>
      <Switch checked={value} color='#007aff' onChange={(event) => onChange(event.detail.value)} />
    </View>
  )
}
