import { Text, View } from '@tarojs/components'
import { AppIcon, type IconName } from '@/components/common/AppIcon'
import './home.scss'

export type HomeServiceTileTone = 'primary' | 'success' | 'warning'

interface HomeServiceTileProps {
  label: string
  value: string
  icon: IconName
  tone: HomeServiceTileTone
  onClick: () => void
}

export function HomeServiceTile({ label, value, icon, tone, onClick }: HomeServiceTileProps) {
  return (
    <View
      className={`home-service-tile home-service-tile--${tone} pressable`}
      aria-label={`${label}，${value}`}
      onClick={onClick}
    >
      <View className='home-service-tile__icon'>
        <AppIcon name={icon} size={24} />
      </View>
      <View className='home-service-tile__content'>
        <Text className='home-service-tile__label'>{label}</Text>
        <Text className='home-service-tile__value'>{value}</Text>
      </View>
    </View>
  )
}
