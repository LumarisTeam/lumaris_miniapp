import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { useTranslation } from '@/i18n'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 帮助。
 *
 * 结构与 Flutter `lib/ui/pages/helper_page/helper_page.dart` 的分标签一致，但内容
 * 只讲小程序自己的行为——Flutter 的帮文里提到的待办、桌面小组件、校园网在这里
 * 都不存在，直接照抄会误导用户。
 */

type HelpTab = 'guide' | 'notes'

const GUIDE_KEYS: Array<{ title: 'helpLoginTitle' | 'helpScheduleTitle' | 'helpWebTitle'; body: 'helpLoginBody' | 'helpScheduleBody' | 'helpWebBody' }> = [
  { title: 'helpLoginTitle', body: 'helpLoginBody' },
  { title: 'helpScheduleTitle', body: 'helpScheduleBody' },
  { title: 'helpWebTitle', body: 'helpWebBody' },
]

export default function HelpPage() {
  const t = useTranslation()
  const [tab, setTab] = useState<HelpTab>('guide')

  return (
    <PageShell title={t('help')} showBack>
      <View className='page-section'>
        <View className='segmented'>
          <View
            className={`segmented__item pressable ${tab === 'guide' ? 'segmented__item--active' : ''}`}
            onClick={() => setTab('guide')}
          >
            {t('helpInstructionsTab')}
          </View>
          <View
            className={`segmented__item pressable ${tab === 'notes' ? 'segmented__item--active' : ''}`}
            onClick={() => setTab('notes')}
          >
            {t('helpNotesTab')}
          </View>
        </View>
      </View>

      <View className='page-section'>
        <ClubCard padding='none'>
          {tab === 'guide' ? (
            GUIDE_KEYS.map((item) => (
              <View className='help-item' key={item.title}>
                <Text className='help-item__title'>{t(item.title)}</Text>
                <Text className='help-item__body'>{t(item.body)}</Text>
              </View>
            ))
          ) : (
            <View className='help-item'>
              <Text className='help-item__title'>{t('helpRefreshTitle')}</Text>
              <Text className='help-item__body'>{t('helpRefreshBody')}</Text>
            </View>
          )}
        </ClubCard>
      </View>
    </PageShell>
  )
}
