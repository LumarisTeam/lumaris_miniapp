# Flutter 对齐审计

基准：`ios_club_app@02b2aa9123a9a01e8c633f606dc81c923908dcb2`。

本文件只记录可由 Flutter 源码证明的行为。旧 uni-app 提交 `329c6cf` 不再作为 API、状态或页面实现依据，只用于识别需要移除的遗留设计。

## 对齐原则

- Flutter 的 Model、API、Service、Repository、Store 和 Page 一起构成行为基准，不能只按页面名称复刻。
- 微信不支持的原生能力继续按 `REPLICATION_PLAN.md` 降级；除此之外的差异必须有明确任务和测试。
- 每项只有在“实现、Flutter 行为夹具、页面流程”三者通过后才能标记完成。
- 网络数据采用 Flutter 的 `FetchPolicy` / `FetchSnapshot` 语义：本地优先、显式刷新、失败回退并标记 stale。

## 差异矩阵

| 领域 | Flutter 基准 | 当前偏差 | 对齐验收 |
|---|---|---|---|
| 课程模型 | `course_model.dart` 保留 `weekIndexes/teachers/room/courseName/courseCode/weekday/startUnit/endUnit/credits/lessonId/campus/isCustom` | 当前模型压扁字段并丢失课程代码、学分、lessonId 和教师数组 | API 夹具往返不丢字段；详情完整显示 |
| 课程读取 | `CourseService.getCourses` + `CourseRepository`，local-first、refresh fallback、忽略与自定义课程合并 | 当前 Store 启动读缓存，但刷新状态和来源信息不完整 | 本地首屏、远端刷新、失败 stale、损坏缓存均有测试 |
| 周次 | `EduTimeService` + `WeekStartUtils`，使用学校 `weekStartDay`，包含 `week/maxWeek` | 当前固定 1-30，未使用周起始日和学期结束时间 | 周一/周日开周、学期前/后、明日跨周与最大周测试一致 |
| 今日课程 | `ScheduleStore.getTodayCourses`，过滤已结束课程，明日课程跨周计算 | 当前明日切换没有跨周修正 | 周日/开周边界和已结束课程夹具一致 |
| 课表状态 | `ScheduleStore` 保存 currentWeek/weekNow/maxWeek/currentPage/height/isYanTa/showTomorrow | 当前只保存 currentWeek，缺少最大周、真实当前周和校区派生状态 | 周选择范围、回当前周、校区时间表与 Flutter 一致 |
| 成绩模型 | `ScoreModel` 使用字符串原值；`ScoreList` 按学期聚合 | 当前把 GPA/学分提前转 number，页面只保存当前学期 | 保留原值；缓存为全部学期 `ScoreList[]` |
| 成绩计算 | `ScoreList.totalCredit/totalCourse/totalGpa`，处理重修、辅修、0 绩点和无效值 | 当前简单加权平均，重修/辅修结果不同 | 直接移植 Flutter 测试向量并逐项相等 |
| 成绩加载 | local-first 立即展示，后台并行刷新所有学期，单学期失败保留旧缓存 | 当前串行读取当前学期，无完整离线状态 | 全学期并行合并、stale 提示、学期/学年切换一致 |
| 认证 | Flutter 有 20 分钟 Cookie 与安全存储自动重登；本计划明确不保存密码、不自动重登 | 当前会话无时间元数据 | 保留计划差异：会话失效退出；文档和测试明确，不伪装成 Flutter 行为 |
| 认证身份字段 | Flutter 将登录输入保存为 `PrefsKeys.USERNAME`，登录响应 `studentId` 存入 `UserData`；个人页和校园卡使用前者，教务业务 API 使用后者 | 已拆分为 `AuthSession.username` 与 `AuthSession.educationId` | 已纠正；缺少真实学号的旧会话不做猜测性迁移，要求重新登录 |
| 学校 | `School.features` 枚举、enabled、weekStartDay、fallback/cache 与客户端切换 | 当前只隐藏部分入口，直接页面访问仍请求 | 所有入口与页面均 Feature 守卫；切校清理教务缓存 |
| 考试 | `ExamService` 解析结束时间、过滤过期、缓存并控制刷新周期 | 当前只取前三条原始数据 | 过滤、排序、缓存、过期与空状态一致 |
| 学习进度 | `InfoService` 缓存、超时和模块卡片 | 当前只汇总为单条总进度 | 按模块展示 total/other，并支持缓存回退 |
| 校车 | `BusApi` 包含日期数据、新数据与地点过滤；页面状态由 notifier 管理 | 当前只实现日期列表 | 对齐 Flutter 当前页面可见的日期、线路/地点筛选和刷新语义 |
| 电费 | API、余额、周数据、充值、订阅及 Store 状态 | 当前页面局部状态，错误与缓存语义不同 | 对齐请求参数、缓存、订阅状态机和失败回退 |
| 校园卡 | Payment Service/Store 的认证、余额与流水语义 | 当前页面直接请求 | 对齐缓存、输入校验、错误与清理行为 |
| 培养计划 | Program notifier 的分组、刷新与缓存 | 当前页面直接请求且分组字段简化 | 保留完整字段并按 Flutter 规则分组、回退 |
| 校园导航 | Link Service 的排序、缓存和外链 | 当前基础列表已存在，缺少缓存语义 | 排序、空/错/缓存和 web-view 降级测试 |
| 校园地图 | Map notifier 的 POI 排序、分类、选中、定位和错误状态 | 当前仅基础筛选 | 对齐排序、默认中心、选中详情、权限恢复和状态机 |
| 设置 | `SettingsState/Store` 的主题、首页、明日、课表网格、刷新、清缓存等 | 当前设置项和清理行为不完整 | 小程序可实现设置逐项映射；清缓存不清用户自定义数据 |
| i18n | Flutter 页面全部通过 `AppLocalizations` | 当前绝大多数中文硬编码 | 所有业务文案经轻量 i18n 层访问 |
| 视觉 | Flutter 组件、间距、卡片、导航、状态和动效 | 当前未做逐页截图差异验收 | 三尺寸逐页截图并记录差异；不能以旧 uni-app 截图验收 |

## 明确平台差异

- 不保存教务密码，不自动重新登录；401/403 清除会话并要求用户重新登录。
- 不实现 HTML/WebView 课表导入、桌面小组件、后台任务、托盘、安装包下载和任意时间本地通知。
- 外链、地图和更新分别使用微信 `web-view`/剪贴板、原生 `Map`、`UpdateManager`。
