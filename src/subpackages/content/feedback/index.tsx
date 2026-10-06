import { useState } from 'react'
import { Button, Image, Input, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { AppIcon } from '@/components/common/AppIcon'
import { submitFeedback, uploadFeedbackImage } from '@/api/feedback'
import { useAppStore } from '@/stores/app'
import { useTranslation } from '@/i18n'
import {
  FEEDBACK_MAX_CONTACT,
  FEEDBACK_MAX_CONTENT,
  FEEDBACK_MAX_IMAGES,
  buildFeedbackExtra,
  collectEnvironment,
  createRequestId,
} from '@/utils/feedback'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 意见反馈。
 *
 * 对应 Flutter 的 `lib/ui/pages/feedback_page/feedback_page.dart`：描述 + 联系方式 +
 * 图片（≤6）+ 字数统计 + 提交；同一份内容重试时复用同一个 request_id，改内容就换新
 * 的，保证后端不会因为重试收到两条。
 */

interface PickedImage {
  path: string
  name: string
}

export default function FeedbackPage() {
  const t = useTranslation()
  const schoolCode = useAppStore((state) => state.school.code)

  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [images, setImages] = useState<PickedImage[]>([])
  const [submitting, setSubmitting] = useState(false)
  /** 幂等 request_id：内容一变就作废，重试时沿用。 */
  const [requestId, setRequestId] = useState<string | null>(null)
  const [preview, setPreview] = useState('')

  const markDirty = () => setRequestId(null)

  const pickImages = async () => {
    const remaining = FEEDBACK_MAX_IMAGES - images.length
    if (remaining <= 0) {
      Taro.showToast({ title: t('feedbackImageTooMany'), icon: 'none' })
      return
    }
    try {
      const result = await Taro.chooseMedia({
        count: remaining,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
      })
      const picked = (result.tempFiles ?? []).slice(0, remaining).map((file) => ({
        path: file.tempFilePath,
        name: file.tempFilePath.split('/').pop() ?? '',
      }))
      if (picked.length === 0) return
      setImages((current) => [...current, ...picked])
      markDirty()
    } catch {
      // 用户取消选择时不提示。
    }
  }

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
    markDirty()
  }

  const submit = async () => {
    const trimmedContent = content.trim()
    const trimmedContact = contact.trim()
    if (!trimmedContent) {
      Taro.showToast({ title: t('feedbackContentRequired'), icon: 'none' })
      return
    }
    if (!trimmedContact) {
      Taro.showToast({ title: t('feedbackContactRequired'), icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const attachmentIds: number[] = []
      for (const image of images) {
        attachmentIds.push(await uploadFeedbackImage(image.path, image.name))
      }

      const nextRequestId = requestId ?? createRequestId()
      setRequestId(nextRequestId)

      await submitFeedback({
        requestId: nextRequestId,
        content: trimmedContent,
        contact: trimmedContact,
        attachmentIds,
        extra: buildFeedbackExtra(collectEnvironment(schoolCode.toLowerCase())),
      })

      Taro.showToast({ title: t('feedbackSubmitSuccess'), icon: 'success' })
      setContent('')
      setContact('')
      setImages([])
      setRequestId(null)
      setTimeout(() => Taro.navigateBack(), 400)
    } catch (submitError) {
      Taro.showToast({
        title: submitError instanceof Error ? submitError.message : t('loadFailed'),
        icon: 'none',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title={t('feedback')} showBack>
      <View className='page-section'>
        <Text className='feedback-intro'>{t('feedbackSubtitle')}</Text>
      </View>

      <View className='page-section'>
        <View className='feedback-label'>
          <Text className='feedback-label__text'>{t('feedbackContentLabel')}</Text>
          <Text className='feedback-label__required'>*</Text>
          <Text className='feedback-label__count'>{`${content.length}/${FEEDBACK_MAX_CONTENT}`}</Text>
        </View>
        <ClubCard>
          <Textarea
            className='feedback-textarea'
            value={content}
            maxlength={FEEDBACK_MAX_CONTENT}
            placeholder={t('feedbackContentHint')}
            onInput={(event) => {
              setContent(event.detail.value)
              markDirty()
            }}
          />
        </ClubCard>
      </View>

      <View className='page-section'>
        <View className='feedback-label'>
          <Text className='feedback-label__text'>{t('feedbackContactLabel')}</Text>
          <Text className='feedback-label__required'>*</Text>
          <Text className='feedback-label__count'>{`${contact.length}/${FEEDBACK_MAX_CONTACT}`}</Text>
        </View>
        <ClubCard>
          <Input
            className='feedback-input'
            value={contact}
            maxlength={FEEDBACK_MAX_CONTACT}
            placeholder={t('feedbackContactHint')}
            onInput={(event) => {
              setContact(event.detail.value)
              markDirty()
            }}
          />
        </ClubCard>
      </View>

      <View className='page-section'>
        <View className='feedback-label'>
          <Text className='feedback-label__text'>{t('feedbackImagesLabel')}</Text>
        </View>
        <View className='feedback-images'>
          {images.map((image, index) => (
            <View className='feedback-image' key={`${image.path}-${index}`}>
              <View className='feedback-image__thumb' onClick={() => setPreview(image.path)}>
                <Image className='feedback-image__picture' src={image.path} mode='aspectFill' />
              </View>
              <View className='feedback-image__remove pressable' onClick={() => removeImage(index)}>
                <AppIcon name='close' size={14} color='var(--on-accent)' />
              </View>
            </View>
          ))}
          {images.length < FEEDBACK_MAX_IMAGES ? (
            <View className='feedback-add pressable' onClick={() => void pickImages()}>
              <AppIcon name='add' size={26} color='var(--secondary-label)' />
              <Text className='feedback-add__label'>{t('feedbackAddImage')}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className='page-section'>
        <Button className='primary-button' loading={submitting} disabled={submitting} onClick={() => void submit()}>
          {submitting ? t('feedbackSubmitting') : t('feedbackSubmit')}
        </Button>
      </View>

      {preview ? (
        <View className='feedback-preview' onClick={() => setPreview('')}>
          <Image className='feedback-preview__picture' src={preview} mode='aspectFit' />
        </View>
      ) : null}
    </PageShell>
  )
}
