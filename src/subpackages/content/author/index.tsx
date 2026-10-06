import { Image, Text, View } from '@tarojs/components'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { ListRow } from '@/components/common/ListRow'
import { AppIcon } from '@/components/common/AppIcon'
import { useTranslation } from '@/i18n'
import { openExternalUrl } from '@/utils/platform'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 作者与开源项目。
 *
 * 对应 Flutter 的 `lib/ui/pages/author_page/author_page.dart`：团队头图 + 核心团队
 * 名单 + 致谢 + 联系方式 + 版权行。名单与链接和 Flutter 里写死的那份保持一致
 * （人名与角色本来就是专有名词，不进语言包）。
 */
const TEAM: Array<{ name: string; role: string }> = [
  { name: 'LuckyFish', role: 'Lead Developer' },
  { name: 'zealous', role: 'Developer' },
  { name: 'borry', role: 'Developer' },
  { name: 'YoChine_Lanee', role: 'Developer' },
  { name: 'To-fly-high', role: 'Developer' },
  { name: 'Alpharc', role: 'Developer' },
  { name: '白熊', role: 'Developer' },
]

const CONTACTS: Array<{ titleKey: 'githubRepository' | 'joinUs'; icon: 'book' | 'people'; url: string }> = [
  { titleKey: 'githubRepository', icon: 'book', url: 'https://github.com/iOS-Club-XAUAT/ios_club_app' },
  { titleKey: 'joinUs', icon: 'people', url: 'https://iosclub.org' },
]

export default function AuthorPage() {
  const t = useTranslation()
  return (
    <PageShell title={t('aboutAuthor')} showBack>
      <View className='author-header'>
        <Image className='author-header__logo' src={logo} mode='aspectFit' />
        <Text className='author-header__name'>Lumaris Team</Text>
        <Text className='author-header__tagline'>{t('tagline')}</Text>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('coreTeam')}</Text>
        <ClubCard padding='none'>
          {TEAM.map((member) => (
            <ListRow key={member.name} title={member.name} subtitle={member.role} icon='people' />
          ))}
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('specialThanks')}</Text>
        <ClubCard>
          <View className='author-thanks'>
            <View className='author-thanks__head'>
              <AppIcon name='success' size={20} color='var(--danger)' />
              <Text className='author-thanks__title'>{t('thanksTitle')}</Text>
            </View>
            <Text className='author-thanks__content'>{t('thanksContent')}</Text>
          </View>
        </ClubCard>
      </View>

      <View className='page-section'>
        <Text className='form-label'>{t('contactUs')}</Text>
        <ClubCard padding='none'>
          {CONTACTS.map((item) => (
            <ListRow
              key={item.url}
              title={t(item.titleKey)}
              icon={item.icon}
              onClick={() => void openExternalUrl(item.url)}
            />
          ))}
        </ClubCard>
      </View>

      <View className='author-footer'>
        <Text className='author-footer__copyright'>© 2026 Lumaris Team</Text>
        <Text className='author-footer__love'>{t('madeWithLove')}</Text>
      </View>
    </PageShell>
  )
}
