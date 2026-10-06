import type { PropsWithChildren } from 'react'
import { PageShell } from '@/components/common/PageShell'
import { StateView } from '@/components/common/StateView'
import { useAppStore } from '@/stores/app'
import { useTranslation } from '@/i18n'
import type { Feature } from '@/types/domain'

interface FeatureGuardProps extends PropsWithChildren {
  feature: Feature
  title: string
  showBack?: boolean
}

export function FeatureGuard({ feature, title, showBack = true, children }: FeatureGuardProps) {
  const t = useTranslation()
  const supported = useAppStore((state) => state.school.enabled && state.school.features.includes(feature))
  if (!supported) {
    return <PageShell title={title} showBack={showBack}><StateView state='empty' title={t('schoolNotSupported')} /></PageShell>
  }
  return <>{children}</>
}
