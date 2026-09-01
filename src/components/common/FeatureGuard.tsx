import type { PropsWithChildren } from 'react'
import { PageShell } from '@/components/common/PageShell'
import { StateView } from '@/components/common/StateView'
import { useAppStore } from '@/stores/app'
import type { Feature } from '@/types/domain'

interface FeatureGuardProps extends PropsWithChildren {
  feature: Feature
  title: string
  showBack?: boolean
}

export function FeatureGuard({ feature, title, showBack = true, children }: FeatureGuardProps) {
  const supported = useAppStore((state) => state.school.enabled && state.school.features.includes(feature))
  if (!supported) {
    return <PageShell title={title} showBack={showBack}><StateView state='empty' title={`当前学校暂不支持${title}`} /></PageShell>
  }
  return <>{children}</>
}
