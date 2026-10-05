/**
 * 本地缓存有效期分级。
 *
 * 对应 Flutter `lib/core/utils/request_cache.dart` 的 `CachePolicy`（HTTP 层）
 * 与各 service 自己维护的刷新窗口（数据层），取两者中实际决定“多久算旧”的那个。
 *
 * 注意：过期不会丢弃数据——`readCache` 仍然返回条目，只是把 `isStale` 标为
 * true，并且 local-first 会改为等一次网络请求。所以调大只会更省流量，调小
 * 只会更勤快，两者都不会让离线态变成空白。
 */
export const CacheTtl = {
  /** 1 分钟 — 校车、校园卡、电费、时间/信息类接口 */
  shortTerm: 60 * 1000,
  /** 5 分钟 — Flutter CachePolicy 的默认档（校园导航、校园地图） */
  default: 5 * 60 * 1000,
  /** 15 分钟 — 课程 */
  mediumTerm: 15 * 60 * 1000,
  /** 1 小时 — 成绩、学期列表 */
  longTerm: 60 * 60 * 1000,
  /** 3 小时 — 学习进度（Flutter InfoService 的 3 小时刷新窗口） */
  studyProgress: 3 * 60 * 60 * 1000,
  /** 1 天 — 培养计划、作息表 */
  veryLongTerm: 24 * 60 * 60 * 1000,
} as const
