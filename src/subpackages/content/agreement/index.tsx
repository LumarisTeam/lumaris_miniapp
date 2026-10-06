import { PageShell } from '@/components/common/PageShell'
import { DocumentView, type DocumentSection } from '@/components/common/DocumentView'
import { useTranslation, type MessageKey, type Translator } from '@/i18n'
import '@/styles/pages.scss'

/**
 * 用户协议。
 *
 * 文案与结构对齐 Flutter 的 `lib/ui/pages/user_agreement_page/user_agreement_page.dart`。
 */
export function agreementSections(t: Translator): DocumentSection[] {
  const paragraphs = (keys: MessageKey[]): string[] => keys.map((key) => t(key))
  const s1: MessageKey[] = ['userAgreementSection1_1', 'userAgreementSection1_2', 'userAgreementSection1_3']
  const s2: MessageKey[] = ['userAgreementSection2_1', 'userAgreementSection2_2', 'userAgreementSection2_3']
  const s3: MessageKey[] = ['userAgreementSection3_1', 'userAgreementSection3_2', 'userAgreementSection3_3', 'userAgreementSection3_4']
  const s4: MessageKey[] = ['userAgreementSection4_1', 'userAgreementSection4_2', 'userAgreementSection4_3']
  const s5: MessageKey[] = ['userAgreementSection5_1', 'userAgreementSection5_2', 'userAgreementSection5_3', 'userAgreementSection5_4']
  const s6: MessageKey[] = ['userAgreementSection6_1', 'userAgreementSection6_2', 'userAgreementSection6_3']
  const s7: MessageKey[] = ['userAgreementSection7_1', 'userAgreementSection7_2', 'userAgreementSection7_3']

  return [
    { heading: t('userAgreementSection1Title'), paragraphs: paragraphs(s1) },
    { heading: t('userAgreementSection2Title'), paragraphs: paragraphs(s2) },
    { heading: t('userAgreementSection3Title'), paragraphs: paragraphs(s3) },
    { heading: t('userAgreementSection4Title'), paragraphs: paragraphs(s4) },
    { heading: t('userAgreementSection5Title'), paragraphs: paragraphs(s5) },
    { heading: t('userAgreementSection6Title'), paragraphs: paragraphs(s6) },
    { heading: t('userAgreementSection7Title'), paragraphs: paragraphs(s7) },
    { heading: t('userAgreementSection8Title'), paragraphs: [t('userAgreementSection8_1'), t('userAgreementContact')] },
  ]
}

export default function AgreementPage() {
  const t = useTranslation()
  return (
    <PageShell title={t('userAgreement')} showBack>
      <DocumentView
        title={t('userAgreementTitle')}
        updatedAt={t('userAgreementUpdatedAt')}
        effectiveAt={t('userAgreementEffectiveAt')}
        intro={t('userAgreementIntro')}
        sections={agreementSections(t)}
      />
    </PageShell>
  )
}
