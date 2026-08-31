# 光序 Flutter 到 Taro 微信小程序复刻计划

## 基线

- Flutter 行为与视觉基线：`ios_club_app` 提交 `02b2aa9123a9a01e8c633f606dc81c923908dcb2`。
- Taro 目标工程基线：`lumaris_miniapp` 提交 `b8020b91248199165a83480a11ea5458d6ea1ace`。
- 旧 Vue/uni-app 参考实现：提交 `329c6cfccc5c4b7385e97d6050cc719fed7662ca`，只用于核对 API、类型和业务逻辑。
- 首轮验收平台：微信小程序；界面以 Flutter 手机端为准；文案只交付简体中文。

## 交付范围

四个 Tab 为首页、课表、成绩和我的。业务页面包含登录、学校能力、考试、培养计划、校园导航、校车、电费、校园卡、校园网、校园地图、设置、帮助、协议、隐私、作者、许可证和彩蛋。课程支持周切换、详情、忽略及手工自定义课程；首页支持本地待办。

以下 Flutter 原生能力不在首轮等价实现范围内：HTML/WebView 课表导入、桌面小组件、后台任务、托盘、安装包下载和本地定时通知。课程及待办提醒显示小程序能力说明，并为后续微信订阅消息保留服务接口。外链优先打开合法域名 `web-view`，无法打开时复制链接。

## 技术架构

- React 18、Taro 4.2.1、TypeScript、SCSS、NutUI React Taro。
- Zustand 负责认证、学校、课程、课表、设置和待办；页面级瞬时加载状态留在页面 Hook。
- 主包只包含四个 Tab、认证和公共基础；校园服务、设置和内容页使用分包。
- 请求层统一处理超时、响应归一化和 401/403。认证只保存用户资料与服务端会话，不保存教务密码。
- 存储键使用 `lumaris:v1:*`，启动时迁移旧 `lm_*` 数据并丢弃无法验证的数据。
- API 根地址通过 `TARO_APP_API_BASE_URL` 注入，默认值为 `https://xauatapi.xauat.site/v1`。
- 地图使用 Taro `Map` 与微信定位授权；电费图表使用 `taro-f2-react@1.3.0` 和 `@antv/f2@4`。
- 独立请求并行执行；大模块直接导入并放入分包，避免无关 barrel import。

## 功能映射

| Flutter 模块 | Taro 交付 | 小程序差异 |
|---|---|---|
| Home / ScheduleWidget / ExamCard / TilesWidget | 首页课程、考试、服务快捷入口 | 去除双击退出 |
| TodoWidget | 本地待办增删改查与到期状态 | 不做系统定时通知 |
| ScheduleList / ScheduleSetting | 周课表、忽略课程、显示配置 | 不提供 HTML 导入 |
| CustomCourseManage | 手工课程增删改 | 使用小程序表单和弹层 |
| Score / Profile / Program | 成绩、统计、学习进度、培养计划 | 保持服务端能力开关 |
| Bus / Electricity / Payment / Net | 校车、电费、校园卡、校园网 | 外链受合法域名限制 |
| CampusMap | 原生地图、定位、POI 筛选 | 使用微信地图组件 |
| Settings / Agreement pages | 设置和静态内容分包 | 更新使用 `UpdateManager` |
| Notification / Widget / Workmanager | 能力说明与扩展接口 | 首轮不实现原生能力 |

## 阶段与验收

1. T00：建立本计划和可追踪任务清单。
2. T01：工程脚本、测试、路径、环境和分包配置通过检查。
3. T02：主题令牌和公共组件覆盖亮暗色、状态栏与安全区。
4. T03：领域类型、API、版本化存储、旧数据迁移和 Zustand 状态层可测试。
5. T04：课程主链路在游客、登录、缓存、空数据和跨周场景可用。
6. T05：成绩、个人资料、GPA/学分和学习进度行为与 Flutter 对齐。
7. T06：校园服务处理加载、刷新、缓存、无权限、空数据和失败状态。
8. T07：设置、说明内容、降级能力与微信更新入口完整可达。
9. T08：`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build:weapp` 全部通过，并检查包体。

## 发布阻塞项

- 正式微信 AppID。
- `https://xauatapi.xauat.site` 请求合法域名配置。
- 需要内嵌的网页业务域名配置。
- 真实账号的真机登录、定位和发布版回归。

这些项目不阻塞开发工具构建与模拟数据验收，但在 `TASKS.md` 中保持 `[!]` 状态，直到资质齐备。
