export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/schedule/index',
    'pages/score/index',
    'pages/profile/index',
    'pages/login/index',
  ],
  subpackages: [
    {
      root: 'subpackages/services',
      pages: [
        'bus/index',
        'electricity/index',
        'payment/index',
        'program/index',
        'links/index',
        'network/index',
        'map/index',
      ],
    },
    {
      root: 'subpackages/settings',
      pages: ['index/index', 'schedule/index', 'custom-course/index'],
    },
    {
      root: 'subpackages/content',
      pages: ['about/index', 'document/index', 'webview/index'],
    },
  ],
  window: {
    backgroundColor: '#f8f8f8',
    backgroundTextStyle: 'dark',
    navigationStyle: 'custom',
    navigationBarTitleText: '光序',
  },
  tabBar: {
    color: '#8e8e93',
    selectedColor: '#007aff',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'static/tabbar/home.png',
        selectedIconPath: 'static/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/schedule/index',
        text: '课表',
        iconPath: 'static/tabbar/calendar.png',
        selectedIconPath: 'static/tabbar/calendar-active.png',
      },
      {
        pagePath: 'pages/score/index',
        text: '成绩',
        iconPath: 'static/tabbar/score.png',
        selectedIconPath: 'static/tabbar/score-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'static/tabbar/profile.png',
        selectedIconPath: 'static/tabbar/profile-active.png',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '用于在校园地图中显示当前位置',
    },
  },
  requiredPrivateInfos: ['getLocation'],
  lazyCodeLoading: 'requiredComponents',
})
