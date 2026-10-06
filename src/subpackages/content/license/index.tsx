import { ScrollView, Text, View } from '@tarojs/components'
import { PageShell } from '@/components/common/PageShell'
import { useTranslation } from '@/i18n'
import '@/styles/pages.scss'
import './index.scss'

/**
 * 开源许可证。
 *
 * 对应 Flutter 的 `lib/ui/pages/license_page/license_page.dart`：整页展示应用随包的
 * LICENSE 文本。小程序没有 assets 机制，文本直接内联在这里（与仓库根目录的
 * LICENSE 一致）。
 */
export const MIT_LICENSE = `MIT License

Copyright (c) 2025 LuckyFish好牛的

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

export default function LicensePage() {
  const t = useTranslation()
  return (
    <PageShell title={t('licenseTitle')} showBack>
      <ScrollView scrollY className='license-scroll'>
        <View className='license-body'>
          <Text className='license-text'>{MIT_LICENSE}</Text>
        </View>
      </ScrollView>
    </PageShell>
  )
}
