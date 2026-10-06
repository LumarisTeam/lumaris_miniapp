import { PageShell } from '@/components/common/PageShell'
import { DocumentView, type DocumentSection } from '@/components/common/DocumentView'
import { useTranslation, type MessageKey, type Translator } from '@/i18n'
import '@/styles/pages.scss'

/**
 * 隐私协议。
 *
 * 文案与结构对齐 Flutter 的 `lib/ui/pages/privacy_policy_page/privacy_policy_page.dart`，
 * 段落来自 Flutter ARB 里的 `privacySection*`。
 */
export function privacySections(t: Translator): DocumentSection[] {
  const paragraphs = (keys: MessageKey[]): string[] => keys.map((key) => t(key))
  const s1: MessageKey[] = ['privacySection1_1', 'privacySection1_2', 'privacySection1_3', 'privacySection1_4', 'privacySection1_5']
  const s2: MessageKey[] = ['privacySection2_1', 'privacySection2_2', 'privacySection2_3', 'privacySection2_4']
  const s3: MessageKey[] = ['privacySection3_1', 'privacySection3_2', 'privacySection3_3']
  const s4: MessageKey[] = ['privacySection4_1', 'privacySection4_2', 'privacySection4_3']
  const s5: MessageKey[] = ['privacySection5_1', 'privacySection5_2', 'privacySection5_3']
  const s6: MessageKey[] = ['privacySection6_1', 'privacySection6_2']
  const s7: MessageKey[] = ['privacySection7_1', 'privacySection7_2']

  return [
    { heading: t('privacySection1Title'), paragraphs: paragraphs(s1) },
    { heading: t('privacySection2Title'), paragraphs: paragraphs(s2) },
    { heading: t('privacySection3Title'), paragraphs: paragraphs(s3) },
    { heading: t('privacySection4Title'), paragraphs: paragraphs(s4) },
    { heading: t('privacySection5Title'), paragraphs: paragraphs(s5) },
    { heading: t('privacySection6Title'), paragraphs: paragraphs(s6) },
    { heading: t('privacySection7Title'), paragraphs: paragraphs(s7) },
    { heading: t('privacySection8Title'), paragraphs: [t('privacySection8_1'), t('privacyContact')] },
  ]
}

export default function PrivacyPage() {
  const t = useTranslation()
  return (
    <PageShell title={t('privacyPolicy')} showBack>
      <DocumentView
        title={t('privacyPolicyTitle')}
        updatedAt={t('privacyPolicyUpdatedAt')}
        effectiveAt={t('privacyPolicyEffectiveAt')}
        intro={t('privacyPolicyIntro')}
        sections={privacySections(t)}
      />
    </PageShell>
  )
}
