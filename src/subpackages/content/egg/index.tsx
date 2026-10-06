import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { AppIcon } from '@/components/common/AppIcon'
import { useTranslation } from '@/i18n'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 彩蛋页。
 *
 * 对应 Flutter 的 `lib/ui/pages/easter_egg_page/easter_egg_page.dart`：连点设置页
 * 的版本号 5 次进入。
 */
export default function EggPage() {
  const t = useTranslation()
  return (
    <PageShell title={t('easterEggTitle')} showBack>
      <View className='egg'>
        <View className='egg__badge'>
          <AppIcon name='success' size={54} color='var(--warning)' />
        </View>
        <Text className='egg__title'>{t('easterEggFound')}</Text>
        <Text className='egg__content'>{t('easterEggContent')}</Text>
        <View className='egg__action pressable' onClick={() => Taro.navigateBack()}>
          {t('back')}
        </View>
      </View>
    </PageShell>
  )
}
