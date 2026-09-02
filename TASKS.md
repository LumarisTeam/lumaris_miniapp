# 光序小程序复刻任务

状态：`[ ]` 待办，`[~]` 进行中，`[x]` 完成，`[!]` 外部阻塞。

## 2026-09-01 审计快照

- 功能主体：四个 Tab、登录、课程、成绩、个人中心、校园服务、设置和内容页均已有实现。
- 自动化基线：`pnpm typecheck`、`pnpm lint`、34 项 Jest 测试和 `pnpm build:weapp` 已通过。
- 测试现状：已增加 Flutter 周次/跨周、成绩、API Model、学校 API 路由、作用域缓存和离线回退测试；完整 Store、页面流程和微信运行时测试仍不足。
- 发布状态：尚未达到“复刻完成/可发布”。剩余重点为周起始日、离线缓存、i18n 接入、组件/流程测试、三尺寸视觉回归、开发者工具与真机验收。
- 环境阻塞：微信开发者工具已安装，但 CLI 服务端口关闭且本轮 Mac 处于锁屏状态；正式 AppID、请求合法域名、业务域名和真实测试账号尚未提供。
- 纠偏说明：用户测试确认旧实现与 uni-app bug/逻辑高度同构；原 T01-T08 的完成标记仅表示“曾经实现并可构建”，不表示 Flutter parity 验收通过。当前以 R00-R07 为唯一完成口径。

## Flutter 重新对齐（当前主线）

- [x] R00-01 建立三方差异审计并废止旧 uni-app 实现基准
  - 依赖：无
  - Flutter 参考：Model、API、Service、Repository、Store、Page 全量源码
  - 验收：每个领域记录 Flutter 行为、当前偏差、平台差异和验收证据
  - 验证：`test -f FLUTTER_PARITY_AUDIT.md`
  - 结果：见 `FLUTTER_PARITY_AUDIT.md`；旧 uni-app 仅用于识别遗留问题
- [~] R01-01 重写领域模型、API 响应与错误语义
  - 依赖：R00-01
  - Flutter 参考：`features/education/models`、`features/education/apis`
  - 验收：字段不丢失，响应解析、错误、空数据与 Flutter 测试向量一致
  - 验证：领域/API 夹具测试
  - 结果：Course/Score/Time 已改为 Flutter canonical 字段；学分/GPA 聚合、重修规则、考试时间过滤和课程周次向量已加入；API 夹具矩阵仍未完成
- [~] R01-02 重写 Repository、FetchPolicy、缓存和失效策略
  - 依赖：R01-01
  - Flutter 参考：`core/repositories`、`edu_fetch_models.dart`、各 Service
  - 验收：本地优先、后台刷新、失败回退、stale 和清缓存语义一致
  - 验证：Repository/Store 单测与离线流程测试
  - 结果：课程、成绩、学习进度、校车、电费、校园卡、培养计划、校园导航和地图已接入学校/账号作用域、时间戳、本地优先、后台刷新与失败 stale；考试已使用作用域缓存，完整 Store/页面测试仍未完成
- [~] R02-01 重写课程、周次、课表和今日/明日课程逻辑
  - 依赖：R01
  - Flutter 参考：`course_service.dart`、`edu_time_service.dart`、`schedule_store.dart`
  - 验收：周起始日、最大周、跨周、已结束课程、忽略和自定义课程一致
  - 验证：Flutter 行为向量测试与页面流程
  - 结果：已直接移植周一/周日开周、学期前 week=0、明日跨周、已结束课程过滤、周范围格式和刷新后清空忽略项；课程冲突及页面流程仍未验收
- [~] R03-01 重写成绩聚合、缓存、学期/学年视图和详情
  - 依赖：R01
  - Flutter 参考：`score_model.dart`、`score_service.dart`、`score_page.dart`
  - 验收：重修、辅修、0 绩点、全学期并行刷新和 stale 行为一致
  - 验证：Flutter 成绩测试向量与页面流程
  - 结果：字符串原值、重修/辅修/0 绩点规则、全学期并行合并、作用域缓存、学期/学年切换和详情已实现；真实账号页面流程与更多成绩向量仍待验证
- [ ] R03-02 重写个人中心和学习进度
  - 依赖：R01、R03-01
  - Flutter 参考：`profile_page.dart`、`study_credit_card.dart`、`info_service.dart`
  - 验收：模块卡片、登录/游客态和 Feature 行为一致
  - 验证：组件与 Feature 测试
- [~] R04-01 重写校车、电费、校园卡和培养计划状态机
  - 依赖：R01-02
  - Flutter 参考：对应 API、Service、Notifier 和 Page
  - 验收：参数、缓存、刷新、筛选、错误和空状态一致
  - 验证：固定夹具、Store 和页面测试
  - 结果：已纠正 Flutter API 字段、`Program/GetDic` 分组、校园卡收支符号、校车未来七天/出发校区/过期班次、到达时间、电费统计、缓存与 stale 回退；电费完整订阅状态机和独立 Store 测试仍未完成
- [~] R04-02 重写校园导航和校园地图状态机
  - 依赖：R01-02
  - Flutter 参考：Link/Map Service、Notifier 和 Page
  - 验收：排序、筛选、选中、定位、缓存和平台降级一致
  - 验证：固定夹具、权限与页面测试
  - 结果：校园导航已恢复分类层级，地图已纠正 snake_case、停用 POI、排序、字符串 ID 到微信 marker ID 的映射和选中详情；权限与页面流程仍待微信环境验证
- [~] R05-01 重写设置、清缓存和学校 Feature 守卫
  - 依赖：R01-R04
  - Flutter 参考：`settings_store.dart`、`setting_page.dart`、`school.dart`
  - 验收：小程序可实现设置完整；入口与直接访问均受 Feature 控制
  - 验证：Store、路由和重启恢复测试
  - 结果：教务 API 已按 `School.website` 路由，切校清远端缓存且保留自定义数据；课表、成绩及全部有 Feature 的校园服务使用页面守卫，守卫组件测试和设置清缓存入口未完成
- [ ] R05-02 全量接入简体中文 i18n
  - 依赖：R02-R05
  - Flutter 参考：`app_zh.arb`
  - 验收：页面、弹层、Toast、错误和状态文案不再散落硬编码
  - 验证：文案扫描与关键页面测试
- [ ] R06-01 按 Flutter 逐页重做视觉与交互
  - 依赖：R02-R05
  - Flutter 参考：对应 Page/Component/Theme
  - 验收：三尺寸布局、层级、控件、状态和交互逐页一致
  - 验证：375x667、390x844、360x800 截图差异
- [ ] R07-01 完成全量自动化和微信环境验收
  - 依赖：R01-R06
  - Flutter 参考：`test/` 与当前手机端
  - 验收：逻辑向量、API、Store、组件、流程、视觉、包体和真机全部通过
  - 验证：`pnpm typecheck && pnpm lint && pnpm test && pnpm build:weapp` 加开发者工具记录

## T00 文档建档

- [x] T00-01 创建复刻计划与任务清单
  - 依赖：无
  - Flutter 参考：仓库整体、`lib/routes/router.dart`
  - 验收：来源版本、范围、平台差异、架构、阶段和发布阻塞项均已记录
  - 验证：`test -f REPLICATION_PLAN.md && test -f TASKS.md`
  - 结果：已创建 `REPLICATION_PLAN.md` 和 `TASKS.md`

## T01 工程基础

- [x] T01-01 安装并锁定 Zustand、Jest、图表和图标依赖
  - 依赖：T00-01
  - Flutter 参考：`pubspec.yaml`
  - 验收：依赖可解析，未引入重复框架
  - 验证：`pnpm install --frozen-lockfile`
  - 结果：已锁定依赖，冻结安装通过
- [x] T01-02 配置 typecheck、lint、test、环境变量、路径别名和微信分包
  - 依赖：T01-01
  - Flutter 参考：`lib/routes/router.dart`
  - 验收：四个 Tab 在主包，校园服务、设置、内容页在分包
  - 验证：`pnpm typecheck && pnpm lint && pnpm test && pnpm build:weapp`
  - 结果：四项检查均通过，四个 Tab 在主包，服务/设置/内容在分包

## T02 设计系统

- [~] T02-01 迁移 Flutter 亮暗色令牌、间距、字号、圆角和动画
  - 依赖：T01-02
  - Flutter 参考：`lib/ui/theme/club_theme.dart`、`club_radii.dart`
  - 验收：跟随系统及手工主题时颜色正确，页面无横向溢出
  - 验证：开发者工具 375x667、390x844、360x800 截图检查
  - 结果：令牌、系统主题、手工主题、安全区和按压态已实现；因缺少微信开发者工具，三组尺寸尚未与 Flutter 截图比对
- [~] T02-02 实现导航栏、卡片、列表、状态视图、弹层和四栏 TabBar
  - 依赖：T02-01
  - Flutter 参考：`lib/ui/components`、`lib/platform/mobile/bottom_navigation.dart`
  - 验收：公共控件覆盖加载、空、错误、禁用和按压状态
  - 验证：组件测试与微信开发者工具交互检查
  - 结果：公共组件和四栏 Tab 已实现；目前只覆盖 `ClubCard`，加载/空/错误/禁用/弹层与 Tab 交互测试未完成

## T03 数据与认证

- [~] T03-01 建立领域类型、API 客户端、错误模型和全部业务 API
  - 依赖：T01-02
  - Flutter 参考：`lib/features/basic`、`lib/features/education/apis`
  - 验收：请求超时、异常响应、401/403 和空数据有统一行为
  - 验证：API 单元测试
  - 结果：领域类型、客户端与业务 API 已实现；客户端基础测试通过，但业务 API 固定夹具、超时、网络失败、异常结构和空数据矩阵未完整覆盖
- [~] T03-02 实现版本化存储、旧 `lm_*` 迁移和 Zustand 状态层
  - 依赖：T03-01
  - Flutter 参考：`lib/state`、`lib/state/prefs_keys.dart`
  - 验收：重启恢复有效数据；损坏数据回退默认值；不保存密码
  - 验证：存储、认证、状态选择器单元测试
  - 结果：Store 初始化前执行迁移且不保存密码；远端缓存已增加作用域、时间戳、校验和异常清理，退出登录清空敏感内存状态；Store 状态机测试仍有限

- [x] T03-03 纠正登录学号与服务端教育标识的字段语义
  - 依赖：T03-01、T03-02
  - Flutter 参考：`lib/ui/pages/login_page/login_page.dart` 的 `_saveLoginInfo()`、`lib/features/education/models/login_response.dart`、`lib/features/education/models/user_data.dart`、`lib/features/education/services/{course,exam,score,program}_service.dart`、`lib/state/payment_store.dart`、`lib/ui/pages/profile_page/profile_page.dart`
  - 验收：登录输入 `username` 作为真实学号用于个人页、校园卡默认卡号和用户级本地作用域；登录响应 `studentId` 仅作为教务内部标识用于课程、考试、成绩和培养计划；两者不相等时仍各自传递正确；不得从响应 ID 或旧显示名猜测学号
  - 验证：`pnpm typecheck && pnpm lint && pnpm test && pnpm build:weapp`
  - 结果：`AuthSession` 已拆为 `username` 与 `educationId`，移除 Flutter 登录响应不存在的 `displayName/name` 假设；缺少真实 `username` 的旧会话会失效并要求重新登录；回归夹具固定 `username=2026123456`、`studentId=84721`。2026-09-01 验证：typecheck、lint、38 项 Jest 与 weapp 构建全部通过

## T04 课程主链路

- [~] T04-01 实现首页课程、考试和服务磁贴
  - 依赖：T02-02、T03-02
  - Flutter 参考：`lib/ui/pages/home_page`
  - 验收：游客、登录、空数据和过期课程状态正确
  - 验证：首页组件测试和开发者工具流程
  - 结果：首页课程、考试、服务、游客态和课程到期状态已实现；缺少首页完整组件流程测试
- [~] T04-02 实现周课表、周选择、课程详情和课程设置
  - 依赖：T04-01
  - Flutter 参考：`schedule_list_page.dart`、`schedule_setting_page.dart`
  - 验收：跨周、周起始日、课程冲突、忽略和缓存刷新正确
  - 验证：课表逻辑单元测试和流程测试
  - 结果：跨周、学校周首日、当前周回退、网格/列表、课程详情、忽略和缓存刷新已实现；冲突课程仍需组件与开发者工具实测
- [~] T04-03 实现自定义课程新增、编辑和删除
  - 依赖：T04-02
  - Flutter 参考：`custom_course_manage_page.dart`
  - 验收：表单校验、周次、节次和持久化正确
  - 验证：自定义课程组件测试
  - 结果：表单校验、周次解析、节次校验和持久化已实现；组件和持久化流程测试未完成

## T05 成绩与个人中心

- [~] T05-01 实现学期、成绩列表、GPA/学分统计和详情
  - 依赖：T03-02、T02-02
  - Flutter 参考：`lib/ui/pages/score_page/score_page.dart`
  - 验收：学期切换、辅修标记、空成绩和统计计算正确
  - 验证：成绩计算单元测试和页面流程
  - 结果：学期/学年切换、辅修标记、空/错状态、Flutter GPA/学分统计、全学期缓存和离线回退已实现；页面流程测试未完成
- [~] T05-02 实现个人资料、学习进度和功能入口
  - 依赖：T05-01
  - Flutter 参考：`profile_page.dart`、`study_credit_card.dart`
  - 验收：登录状态与学校 Feature 控制正确
  - 验证：个人中心组件测试
  - 结果：登录态、游客态、学习进度、入口 Feature 过滤和失败缓存已实现；页面守卫矩阵与组件测试未完成

## T06 校园服务

- [~] T06-01 实现校车、电费、校园卡和培养计划
  - 依赖：T03-02、T02-02
  - Flutter 参考：对应 `lib/ui/pages/*_page`
  - 验收：加载、刷新、缓存、空数据和失败状态完整；电费图表在服务分包
  - 验证：服务逻辑单元测试与页面流程
  - 结果：四项服务页面、F2 趋势图、刷新、加载/空/错、作用域缓存和离线回退已实现；Flutter 完整筛选/状态机与页面测试未完成
- [~] T06-02 实现校园导航和外链回退
  - 依赖：T06-01
  - Flutter 参考：`link_page.dart`
  - 验收：合法链接打开，受限链接可复制
  - 验证：外链适配测试
  - 结果：合法 URL 使用 web-view，失败时复制链接；导航入口可达，但业务域名及失败回退需要开发者工具验证
- [~] T06-03 实现校园地图、定位权限、POI 标记和筛选
  - 依赖：T03-02、T02-02
  - Flutter 参考：`campus_map_page.dart`、`map_notifier.dart`
  - 验收：拒绝权限、定位失败和无 POI 均有可恢复状态
  - 验证：开发者工具定位模拟与真机待办
  - 结果：原生 Map、定位重试、拒绝提示、POI 分类和关键词筛选已实现；定位模拟、marker 点击和真机权限流程未验证

## T07 设置与内容页

- [~] T07-01 实现主题、启动页、触感、提醒说明和更新管理
  - 依赖：T03-02、T02-02
  - Flutter 参考：`lib/ui/pages/setting_page`
  - 验收：设置持久化；更新使用微信 `UpdateManager`
  - 验证：设置组件测试和重启检查
  - 结果：设置持久化、启动页、触感、提醒降级说明、订阅消息 Provider 占位和 UpdateManager 已实现；重启、系统主题和更新流程尚未在微信环境验证
- [x] T07-02 实现帮助、协议、隐私、作者、许可证和彩蛋
  - 依赖：T02-02
  - Flutter 参考：对应内容页
  - 验收：所有入口可达且内容可滚动、复制或跳转
  - 验证：路由清单检查
  - 结果：全部内容页入口可达，文本可滚动，作者链接支持外链回退，彩蛋可触发

## T08 质量与发布准备

- [x] T08-01 完成自动化和包体检查
  - 依赖：T01-02
  - Flutter 参考：`test/`
  - 验收：类型、lint、现有测试和构建通过；主包及单分包小于 2 MB
  - 验证：`pnpm typecheck && pnpm lint && pnpm test && pnpm build:weapp`
  - 结果：typecheck、lint、34 项 Jest 和 weapp 构建通过；构建产物仍低于微信单包 2 MB 限制
- [~] T08-02 完成质量与发布准备总验收
  - 依赖：T08-01、T09、T10
  - Flutter 参考：无
  - 验收：剩余实现、自动化测试、视觉回归、开发者工具流程和正式资质验收全部完成
  - 验证：核对 T09、T10 无待办或阻塞项
  - 结果：当前未完成，详细缺口及阻塞见 T09、T10

## T09 审计后剩余实现

- [~] T09-02 应用学校周起始日并验证跨周课表
  - 依赖：T04-02、T03-02
  - Flutter 参考：`lib/core/utils/week_start_utils.dart`、`lib/ui/components/schedule/weekday_header.dart`
  - 验收：`weekStartDay=1/7` 时星期标题、日期和课程列顺序一致；周日跨周计算正确
  - 验证：周次单测、课表组件测试和两种学校夹具
  - 结果：Flutter 周次向量、两种周首日、学期前 week=0 和明日跨周单测已通过；课表组件与真机流程未完成
- [~] T09-03 建立成绩与校园服务缓存及离线回退
  - 依赖：T03-02、T05-01、T06-01
  - Flutter 参考：`lib/core/utils/request_cache.dart`、`education_cache_service.dart`、各领域 Service
  - 验收：成绩、学期、学习进度、校车、电费、校园卡、培养计划、校园导航和 POI 有带时间戳缓存；网络失败显示缓存并明确标注
  - 验证：缓存命中、过期、损坏、强制刷新和离线单元/组件测试
  - 结果：所列领域均已接入作用域时间戳缓存和 stale 页面提示；已覆盖命中、跨账号拒绝、清理、强制刷新失败回退，仍缺各页面完整组件测试
- [~] T09-04 增加统一学校 Feature 页面守卫
  - 依赖：T03-01、T05-02、T06
  - Flutter 参考：`lib/features/basic/models/school.dart`、`lib/state/settings_store.dart`
  - 验收：入口和直接页面访问均按 Feature 控制；不支持时显示可返回的状态页且不发请求
  - 验证：每项 Feature 开/关的路由组件测试
  - 结果：课表、成绩、校车、电费、校园卡、培养计划和地图已阻止不支持页面挂载及请求；入口过滤已存在，守卫组件矩阵测试未完成
- [ ] T09-05 将简体中文文案接入轻量 i18n
  - 依赖：T02、T04-T07
  - Flutter 参考：`lib/l10n/app_zh.arb`、`lib/core/extensions/localization_extensions.dart`
  - 验收：页面、弹层、Toast、错误和空状态文案均通过 i18n 层访问；页面代码不保留散落业务文案
  - 验证：`rg` 文案审计和关键页面文案测试
- [ ] T09-06 补齐 API、Store、组件和流程自动化测试
  - 依赖：T03-T07、T09-02 至 T09-05
  - Flutter 参考：`test/`
  - 验收：固定夹具覆盖成功、超时、网络失败、401、异常结构和空数据；覆盖主题、周选择、自定义课程、成绩筛选、Feature、缓存回退及全部服务状态
  - 验证：`pnpm exec jest --runInBand --coverage`，业务 API 与 Store 不再为 0% 覆盖率
  - 结果：当前 34 项测试通过，已新增 API 固定夹具、Repository 回退和 Feature 页面阻断测试；Store、页面流程、主题和微信运行时覆盖仍未完成

## T10 微信环境验收

- [!] T10-01 安装微信开发者工具并完成三尺寸视觉回归
  - 依赖：T02、T09
  - Flutter 参考：当前手机端参考截图
  - 验收：375x667、390x844、360x800 下无重叠、溢出或不可操作控件，并记录差异截图
  - 验证：微信开发者工具截图与 Flutter 基线逐页比对
  - 阻塞：已检测到 `/Applications/wechatwebdevtools.app`；CLI 服务端口关闭，本轮因 Mac 锁屏无法进入“设置 -> 安全设置”启用，三尺寸截图尚未执行
- [!] T10-02 完成开发者工具端到端流程验收
  - 依赖：T09、T10-01
  - Flutter 参考：首页、课表、成绩、设置及各校园服务流程
  - 验收：游客、登录、刷新、401、离线、自定义课程、成绩、服务跳转、地图权限和更新流程通过
  - 验证：开发者工具测试记录；需要可用测试账号和接口环境
  - 阻塞：开发者工具 CLI 服务端口尚未启用，并缺少真实测试账号
- [!] T10-03 完成正式资质、域名和真机发布验收
  - 依赖：T10-02
  - Flutter 参考：无
  - 验收：正式 AppID、请求域名、业务域名配置完成；真机登录、定位、web-view、更新和上传审核前回归通过
  - 验证：微信公众平台配置、开发者工具上传和真机测试记录
  - 阻塞：尚未提供正式 AppID、请求合法域名和业务域名资质
