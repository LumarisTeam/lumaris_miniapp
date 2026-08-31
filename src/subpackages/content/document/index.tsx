import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { PageShell } from '@/components/common/PageShell'
import { ClubCard } from '@/components/common/ClubCard'
import { openExternalUrl } from '@/utils/platform'
import '@/styles/pages.scss'
import './index.scss'

interface Section {
  heading: string
  paragraphs: string[]
}

interface DocumentContent {
  title: string
  intro: string
  sections: Section[]
}

const DOCUMENTS: Record<string, DocumentContent> = {
  help: {
    title: '帮助与常见问题',
    intro: '这里整理小程序版光序的主要使用方式和平台限制。',
    sections: [
      { heading: '登录与数据', paragraphs: ['请选择学校后使用教务系统账号登录。为保护账号安全，小程序不会保存密码；会话过期时需要重新登录。', '页面下拉可以刷新网络数据。网络不可用时，课表和本地待办仍会保留。'] },
      { heading: '课表', paragraphs: ['登录后会自动同步课程和学期周次。游客可在课表设置中添加自定义课程。', '小程序版不支持在网页中注入脚本，因此不提供 Flutter 版的 HTML 课表导入。'] },
      { heading: '提醒与网页', paragraphs: ['微信小程序不能安排任意时间的本地通知，当前只显示待办到期状态。', '网页受微信业务域名限制；加载失败时可复制链接到系统浏览器。'] },
    ],
  },
  agreement: {
    title: '软件许可协议',
    intro: '使用光序前，请阅读并理解以下条款。',
    sections: [
      { heading: '服务性质', paragraphs: ['光序是校园信息聚合工具，不属于学校官方教务系统。数据结果以学校相关系统为准。'] },
      { heading: '合理使用', paragraphs: ['请使用本人合法账号，不得利用本软件进行攻击、批量抓取、绕过权限或影响第三方服务。'] },
      { heading: '可用性', paragraphs: ['校园系统维护、网络限制或接口变化可能导致部分功能暂时不可用。开发者会尽力修复，但不承诺服务始终不中断。'] },
    ],
  },
  privacy: {
    title: '隐私政策',
    intro: '光序遵循最少必要原则处理完成校园服务所需的数据。',
    sections: [
      { heading: '处理的数据', paragraphs: ['登录时账号和密码仅用于向教务服务发起认证。小程序不在本地保存密码，只保存会话、学号、所选学校和必要缓存。', '校园地图在用户授权后读取位置，用于显示当前位置；位置不会写入持久化存储。'] },
      { heading: '本地数据', paragraphs: ['课表缓存、自定义课程、待办和设置保存在微信小程序本地存储中。退出登录会清除认证会话；删除小程序可清理全部本地数据。'] },
      { heading: '第三方服务', paragraphs: ['教务、校车、电费、校园卡、地图和外部网页由对应服务提供，其数据处理规则由服务提供方负责。'] },
    ],
  },
  'user-agreement': {
    title: '用户协议',
    intro: '继续使用即表示你同意遵守本协议与相关法律法规。',
    sections: [
      { heading: '账号责任', paragraphs: ['用户应妥善保管账号信息，并对本人账号产生的操作负责。发现异常时请及时修改教务系统密码。'] },
      { heading: '内容与数据', paragraphs: ['课程、成绩、余额、班次等数据仅供个人参考。不得未经授权传播他人信息。'] },
      { heading: '协议更新', paragraphs: ['功能或合规要求变化时，本协议可能更新。重大变化会在版本更新说明中提示。'] },
    ],
  },
  author: {
    title: '作者与开源项目',
    intro: '光序由西安建筑科技大学 iOS Club 社区成员维护。',
    sections: [
      { heading: '项目', paragraphs: ['Flutter 原版与 Taro 小程序版均以改善校园信息获取体验为目标。问题与建议可通过项目仓库反馈。'] },
      { heading: '致谢', paragraphs: ['感谢 Flutter、Taro、React、NutUI、Zustand、AntV F2 及其他开源项目的贡献者。'] },
    ],
  },
  license: {
    title: '开源许可证',
    intro: '光序项目采用 MIT License。第三方依赖分别遵循其自身许可证。',
    sections: [
      { heading: 'MIT License', paragraphs: ['Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, subject to inclusion of the copyright and permission notice.', 'THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.'] },
    ],
  },
  egg: {
    title: '光序彩蛋',
    intro: '时间有序，生活有光。',
    sections: [
      { heading: '今日签', paragraphs: ['每一节课、每一次出发、每一个完成的待办，都会成为大学生活里可见的刻度。', '愿你不被时间追赶，而是拥有自己的光序。'] },
    ],
  },
}

export default function DocumentPage() {
  const router = useRouter()
  const kind = router.params.kind || 'help'
  const document = DOCUMENTS[kind] || DOCUMENTS.help
  const [eggCount, setEggCount] = useState(0)

  return (
    <PageShell title={document.title} showBack>
      <View className='document-header' onClick={() => { if (kind === 'egg') setEggCount((value) => value + 1) }}>
        <Text className='document-header__title'>{document.title}</Text>
        <Text className='document-header__intro'>{document.intro}</Text>
        {kind === 'egg' && eggCount >= 5 ? <Text className='document-egg'>你找到了隐藏刻度：02:17</Text> : null}
      </View>
      {document.sections.map((section) => (
        <View className='page-section' key={section.heading}><ClubCard><Text className='document-section__heading'>{section.heading}</Text>{section.paragraphs.map((paragraph) => <Text className='document-section__paragraph' key={paragraph}>{paragraph}</Text>)}</ClubCard></View>
      ))}
      {kind === 'author' ? <View className='page-section'><View className='document-link pressable' onClick={() => void openExternalUrl('https://github.com/LuckyFishIsDaShen')}><Text>访问项目主页</Text></View></View> : null}
      <View className='document-footer'><Text onClick={() => Taro.setClipboardData({ data: document.title })}>光序 · 点击复制文档标题</Text></View>
    </PageShell>
  )
}
