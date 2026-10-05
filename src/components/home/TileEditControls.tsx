import { Text, View } from '@tarojs/components'
import { AppIcon } from '@/components/common/AppIcon'
import { useTileStore } from '@/stores/tile'
import { useTranslation } from '@/i18n'
import './tileEdit.scss'

/**
 * 「快捷功能」标题与编辑/完成按钮。
 *
 * 对应 Flutter 的 `lib/ui/components/tiles/tile_edit_controls.dart`。
 */
export function TileEditControls() {
  const t = useTranslation()
  const isEditMode = useTileStore((state) => state.isEditMode)
  const toggleEditMode = useTileStore((state) => state.toggleEditMode)

  return (
    <View className='tile-edit-controls'>
      <Text className='tile-edit-controls__title'>{t('shortcuts')}</Text>
      <View
        className={`tile-edit-controls__button pressable ${isEditMode ? 'tile-edit-controls__button--done' : ''}`}
        onClick={toggleEditMode}
      >
        <AppIcon name={isEditMode ? 'check' : 'edit'} size={18} color={isEditMode ? 'var(--on-accent)' : 'var(--primary)'} />
        <Text className='tile-edit-controls__button-text'>{isEditMode ? t('done') : t('edit')}</Text>
      </View>
    </View>
  )
}
