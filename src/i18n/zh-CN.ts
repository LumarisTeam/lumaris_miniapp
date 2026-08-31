const zhCN = {
  appName: '光序',
  home: '首页',
  schedule: '课表',
  score: '成绩',
  profile: '我的',
  loading: '正在读取数据',
  retry: '重试',
  empty: '暂无数据',
  loginRequired: '登录后即可查看此内容',
  networkError: '网络请求失败，请稍后重试',
  sessionExpired: '登录已过期，请重新登录',
} as const

export type MessageKey = keyof typeof zhCN

export function t(key: MessageKey): string {
  return zhCN[key]
}
