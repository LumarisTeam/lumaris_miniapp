import { useEffect, useState } from 'react'
import { Button, Image, Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTranslation } from '@/i18n'
import logo from '@/static/logo.png'
import '@/styles/pages.scss'
import './index.scss'

export default function LoginPage() {
  const t = useTranslation()
  const schools = useAppStore((state) => state.schools)
  const loadSchools = useAppStore((state) => state.loadSchools)
  const setSchool = useAppStore((state) => state.setSchool)
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const [schoolIndex, setSchoolIndex] = useState(0)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => { void loadSchools() }, [loadSchools])

  const submit = async () => {
    if (!username.trim() || !password) {
      Taro.showToast({ title: t('credentialsRequired'), icon: 'none' })
      return
    }
    const school = schools[schoolIndex] ?? schools[0]
    if (!school) return
    setSchool(school)
    clearError()
    const success = await login(username, password, school)
    if (success) {
      Taro.showToast({ title: t('loginSuccess'), icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 350)
    }
  }

  return (
    <PageShell title={t('loginTitle')} showBack className='login-page'>
      <View className='login-brand'>
        <Image className='login-brand__logo' src={logo} mode='aspectFit' />
        <Text className='login-brand__title'>{t('appName')}</Text>
        <Text className='login-brand__subtitle'>{t('loginSubtitle')}</Text>
      </View>

      <View className='page-section'>
        <ClubCard>
          {schools.length > 1 ? (
            <>
              <Text className='form-label'>{t('selectSchool')}</Text>
              <Picker
                mode='selector'
                range={schools.map((school) => school.name)}
                value={schoolIndex}
                onChange={(event) => setSchoolIndex(Number(event.detail.value))}
              >
                <View className='form-picker'>{schools[schoolIndex]?.name ?? t('selectSchool')}</View>
              </Picker>
            </>
          ) : null}

          <Text className='form-label'>{t('studentIdLabel')}</Text>
          <Input
            className='form-input'
            value={username}
            placeholder={t('studentIdPlaceholder')}
            maxlength={24}
            onInput={(event) => setUsername(event.detail.value)}
          />

          <Text className='form-label'>{t('password')}</Text>
          <Input
            className='form-input'
            value={password}
            password
            placeholder={t('passwordPlaceholder')}
            maxlength={64}
            onInput={(event) => setPassword(event.detail.value)}
          />

          {error ? <Text className='login-error'>{error}</Text> : null}

          <Button className='primary-button login-submit' loading={loading} disabled={loading} onClick={() => void submit()}>
            {t('clickToLogin')}
          </Button>
          <View className='page-note login-note'><Text>{t('loginPasswordNote')}</Text></View>
        </ClubCard>
      </View>
    </PageShell>
  )
}
