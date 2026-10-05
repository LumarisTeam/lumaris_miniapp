import { Picker, View } from '@tarojs/components'
import { ListRow } from '@/components/common/ListRow'
import { LOCALE_OPTIONS, useTranslation } from '@/i18n'
import { useAppStore } from '@/stores/app'
import type { LocaleCode } from '@/types/domain'

/**
 * 语言设置项：展示当前语言，点击后选择。
 *
 * 对应 Flutter 的 `lib/ui/pages/setting_page/language_setting.dart`。
 */
export function LanguageSetting() {
  const t = useTranslation()
  const locale = useAppStore((state) => state.settings.locale)
  const setSettings = useAppStore((state) => state.setSettings)
  const index = Math.max(0, LOCALE_OPTIONS.findIndex((option) => option.code === locale))
  const labels = LOCALE_OPTIONS.map((option) => t(option.labelKey))

  return (
    <Picker
      mode='selector'
      range={labels}
      value={index}
      onChange={(event) => {
        const next: LocaleCode = LOCALE_OPTIONS[Number(event.detail.value)]?.code ?? 'system'
        setSettings({ locale: next })
      }}
    >
      <View>
        <ListRow title={t('language')} icon='tips' value={labels[index]} />
      </View>
    </Picker>
  )
}
