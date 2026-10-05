import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Popup } from '@nutui/nutui-react-taro'
import { AppIcon } from '@/components/common/AppIcon'
import { ClubCard } from '@/components/common/ClubCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { StateView } from '@/components/common/StateView'
import { useExamStore } from '@/stores/exam'
import { useTranslation } from '@/i18n'
import { colorForName } from '@/utils/education'
import type { Exam } from '@/types/domain'
import './examCard.scss'

/**
 * 首页近期考试卡片：标题 + 刷新 + 列表，点某场考试看详情。
 *
 * 对应 Flutter 的 `lib/ui/pages/home_page/exam_card.dart`。
 */
export function ExamCard() {
  const t = useTranslation()
  const exams = useExamStore((state) => state.exams)
  const isLoading = useExamStore((state) => state.isLoading)
  const error = useExamStore((state) => state.error)
  const load = useExamStore((state) => state.load)
  const [detail, setDetail] = useState<Exam | null>(null)

  return (
    <>
      <SectionHeader
        title={t('upcomingExams')}
        trailing={
          <View className='icon-action pressable' onClick={() => void load('refresh')}>
            <AppIcon name='refresh' size={20} />
          </View>
        }
      />

      {isLoading && exams.length === 0 ? (
        <ClubCard>
          <StateView state='loading' compact title={t('fetchingScores')} description={t('loadingExamsSubtitle')} />
        </ClubCard>
      ) : error && exams.length === 0 ? (
        <ClubCard>
          <StateView
            state='error'
            compact
            title={t('loadFailed')}
            description={error}
            actionLabel={t('retry')}
            onAction={() => void load('refresh')}
          />
        </ClubCard>
      ) : exams.length === 0 ? (
        <ClubCard>
          <StateView state='empty' compact title={t('empty')} description={t('noExamsSubtitle')} />
        </ClubCard>
      ) : (
        <ClubCard padding='none'>
          {exams.map((exam) => (
            <View className='exam-row pressable' key={exam.id} onClick={() => setDetail(exam)}>
              <View className='exam-row__bar' style={{ backgroundColor: colorForName(exam.name) }} />
              <View className='exam-row__body'>
                <Text className='exam-row__name'>{exam.name}</Text>
                <View className='exam-row__meta'>
                  <AppIcon name='clock' size={16} color='var(--secondary-label)' />
                  <Text className='exam-row__meta-text'>{exam.time || '—'}</Text>
                </View>
                {exam.location ? (
                  <View className='exam-row__meta'>
                    <AppIcon name='location' size={16} color='var(--secondary-label)' />
                    <Text className='exam-row__meta-text'>{exam.location}</Text>
                  </View>
                ) : null}
                {exam.seat ? (
                  <View className='exam-row__meta'>
                    <AppIcon name='list' size={16} color='var(--secondary-label)' />
                    <Text className='exam-row__meta-text'>{t('seatNumberLabel', { seat: exam.seat })}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </ClubCard>
      )}

      <Popup visible={detail !== null} position='bottom' round onClose={() => setDetail(null)}>
        {detail ? (
          <View className='exam-sheet'>
            <Text className='exam-sheet__title'>{detail.name}</Text>
            <View className='exam-sheet__rows'>
              <View className='exam-sheet__row'>
                <Text className='exam-sheet__label'>{t('classTime')}</Text>
                <Text className='exam-sheet__content'>{detail.time || '—'}</Text>
              </View>
              <View className='exam-sheet__row'>
                <Text className='exam-sheet__label'>{t('classroom')}</Text>
                <Text className='exam-sheet__content'>{detail.location || '—'}</Text>
              </View>
              <View className='exam-sheet__row'>
                <Text className='exam-sheet__label'>{t('seatNumberLabel', { seat: '' }).trim()}</Text>
                <Text className='exam-sheet__content'>{detail.seat || '—'}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </Popup>
    </>
  )
}
