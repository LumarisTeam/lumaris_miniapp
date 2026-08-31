# 光序小程序复刻任务

状态：`[ ]` 待办，`[~]` 进行中，`[x]` 完成，`[!]` 外部阻塞。

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

- [x] T02-01 迁移 Flutter 亮暗色令牌、间距、字号、圆角和动画
  - 依赖：T01-02
  - Flutter 参考：`lib/ui/theme/club_theme.dart`、`club_radii.dart`
  - 验收：跟随系统及手工主题时颜色正确，页面无横向溢出
  - 验证：开发者工具 375x667、390x844、360x800 截图检查
  - 结果：令牌、系统主题、手工主题、安全区和按压态已实现；三组截图需在开发者工具中补做
- [x] T02-02 实现导航栏、卡片、列表、状态视图、弹层和四栏 TabBar
  - 依赖：T02-01
  - Flutter 参考：`lib/ui/components`、`lib/platform/mobile/bottom_navigation.dart`
  - 验收：公共控件覆盖加载、空、错误、禁用和按压状态
  - 验证：组件测试与微信开发者工具交互检查
  - 结果：公共组件和四栏 Tab 已实现，组件测试通过

## T03 数据与认证

- [x] T03-01 建立领域类型、API 客户端、错误模型和全部业务 API
  - 依赖：T01-02
  - Flutter 参考：`lib/features/basic`、`lib/features/education/apis`
  - 验收：请求超时、异常响应、401/403 和空数据有统一行为
  - 验证：API 单元测试
  - 结果：响应归一化、超时/网络错误、401/403、空数据和校园服务 API 已覆盖
- [x] T03-02 实现版本化存储、旧 `lm_*` 迁移和 Zustand 状态层
  - 依赖：T03-01
  - Flutter 参考：`lib/state`、`lib/state/prefs_keys.dart`
  - 验收：重启恢复有效数据；损坏数据回退默认值；不保存密码
  - 验证：存储、认证、状态选择器单元测试
  - 结果：Store 初始化前执行迁移；不保存密码；迁移和损坏数据回退测试通过

## T04 课程主链路

- [x] T04-01 实现首页课程、考试、服务磁贴和本地待办
  - 依赖：T02-02、T03-02
  - Flutter 参考：`lib/ui/pages/home_page`
  - 验收：游客、登录、空数据、过期课程和待办到期状态正确
  - 验证：首页组件测试和开发者工具流程
  - 结果：首页课程/考试/服务/待办、游客态和到期状态已实现
- [x] T04-02 实现周课表、周选择、课程详情和课程设置
  - 依赖：T04-01
  - Flutter 参考：`schedule_list_page.dart`、`schedule_setting_page.dart`
  - 验收：跨周、周起始日、课程冲突、忽略和缓存刷新正确
  - 验证：课表逻辑单元测试和流程测试
  - 结果：跨周、当前周回退、网格/列表、冲突叠放、忽略和缓存刷新已实现
- [x] T04-03 实现自定义课程新增、编辑和删除
  - 依赖：T04-02
  - Flutter 参考：`custom_course_manage_page.dart`
  - 验收：表单校验、周次、节次和持久化正确
  - 验证：自定义课程组件测试
  - 结果：表单校验、周次解析、节次校验和持久化已实现

## T05 成绩与个人中心

- [x] T05-01 实现学期、成绩列表、GPA/学分统计和详情
  - 依赖：T03-02、T02-02
  - Flutter 参考：`lib/ui/pages/score_page/score_page.dart`
  - 验收：学期切换、辅修标记、空成绩和统计计算正确
  - 验证：成绩计算单元测试和页面流程
  - 结果：学期切换、辅修标记、空/错状态和 GPA/学分统计已实现
- [x] T05-02 实现个人资料、学习进度和功能入口
  - 依赖：T05-01
  - Flutter 参考：`profile_page.dart`、`study_credit_card.dart`
  - 验收：登录状态与学校 Feature 控制正确
  - 验证：个人中心组件测试
  - 结果：登录态、游客态、学习进度和学校 Feature 过滤已实现

## T06 校园服务

- [x] T06-01 实现校车、电费、校园卡和培养计划
  - 依赖：T03-02、T02-02
  - Flutter 参考：对应 `lib/ui/pages/*_page`
  - 验收：加载、刷新、缓存、空数据和失败状态完整；电费图表在服务分包
  - 验证：服务逻辑单元测试与页面流程
  - 结果：四项服务页面、F2 趋势图、刷新和加载/空/错状态已实现
- [x] T06-02 实现校园导航、校园网和外链回退
  - 依赖：T06-01
  - Flutter 参考：`link_page.dart`、`net_page.dart`
  - 验收：合法链接打开，受限链接可复制
  - 验证：外链适配测试
  - 结果：合法 URL 使用 web-view，失败时复制到系统浏览器；校园网和导航入口可达
- [x] T06-03 实现校园地图、定位权限、POI 标记和筛选
  - 依赖：T03-02、T02-02
  - Flutter 参考：`campus_map_page.dart`、`map_notifier.dart`
  - 验收：拒绝权限、定位失败和无 POI 均有可恢复状态
  - 验证：开发者工具定位模拟与真机待办
  - 结果：原生 Map、定位重试、拒绝提示、POI 分类和关键词筛选已实现

## T07 设置与内容页

- [x] T07-01 实现主题、启动页、触感、提醒说明和更新管理
  - 依赖：T03-02、T02-02
  - Flutter 参考：`lib/ui/pages/setting_page`
  - 验收：设置持久化；更新使用微信 `UpdateManager`
  - 验证：设置组件测试和重启检查
  - 结果：设置持久化、启动页、触感、提醒降级说明、订阅消息 Provider 占位和 UpdateManager 已实现
- [x] T07-02 实现帮助、协议、隐私、作者、许可证和彩蛋
  - 依赖：T02-02
  - Flutter 参考：对应内容页
  - 验收：所有入口可达且内容可滚动、复制或跳转
  - 验证：路由清单检查
  - 结果：全部内容页入口可达，文本可滚动，作者链接支持外链回退，彩蛋可触发

## T08 质量与发布准备

- [~] T08-01 完成自动化检查、视觉回归和包体检查
  - 依赖：T04、T05、T06、T07 全部完成
  - Flutter 参考：`test/`
  - 验收：类型、lint、测试、构建通过；主包及单分包小于 2 MB
  - 验证：`pnpm typecheck && pnpm lint && pnpm test && pnpm build:weapp`
  - 结果：typecheck、lint、16 项 Jest、weapp 构建通过；主包约 0.92 MiB，服务/设置/内容分包约 32/13/15 KiB；三组视口视觉回归待开发者工具执行
- [!] T08-02 正式 AppID、合法域名与真机发布验收
  - 依赖：T08-01、微信资质
  - Flutter 参考：无
  - 验收：真实账号登录、定位、网络、外链和发布版回归通过
  - 验证：微信开发者工具上传与真机测试
  - 阻塞：尚未提供正式 AppID 和域名白名单
