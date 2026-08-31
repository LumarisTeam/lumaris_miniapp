export interface ReminderProvider {
  readonly available: boolean
  readonly description: string
  requestSubscription: (templateIds: string[]) => Promise<boolean>
}

export const reminderProvider: ReminderProvider = {
  available: false,
  description: '当前仅提供应用内到期状态，微信订阅消息将在模板审核后接入。',
  async requestSubscription() {
    return false
  },
}
