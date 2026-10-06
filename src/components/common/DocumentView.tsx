import { Text, View } from '@tarojs/components'
import './documentView.scss'

/**
 * 长文本文档的排版：大标题 + 日期行 + 引言 + 若干「小标题 / 段落」。
 *
 * 对应 Flutter 隐私协议与用户协议页共用的那套 `_buildTitle / _buildSubtitle /
 * _buildSectionTitle / _buildBodyText`。
 */

export interface DocumentSection {
  heading: string
  paragraphs: string[]
}

export function DocumentView({
  title,
  updatedAt,
  effectiveAt,
  intro,
  sections,
  footer,
}: {
  title: string
  updatedAt?: string
  effectiveAt?: string
  intro?: string
  sections: DocumentSection[]
  footer?: string
}) {
  return (
    <View className='document'>
      <Text className='document__title'>{title}</Text>
      {updatedAt ? <Text className='document__date'>{updatedAt}</Text> : null}
      {effectiveAt ? <Text className='document__date'>{effectiveAt}</Text> : null}
      {intro ? <Text className='document__intro'>{intro}</Text> : null}

      {sections.map((section) => (
        <View className='document__section' key={section.heading}>
          <Text className='document__heading'>{section.heading}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text className='document__paragraph' key={paragraph}>{paragraph}</Text>
          ))}
        </View>
      ))}

      {footer ? <Text className='document__footer'>{footer}</Text> : null}
    </View>
  )
}
