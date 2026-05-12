const { ensureUser } = require('./utils/storage')
const theme = require('./utils/theme')

App({
  globalData: {
    userInfo: null,
    envId: 'cloud1-5ggmywvk3303b099'
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: 'cloud1-5ggmywvk3303b099',
      traceUser: true
    })

    ensureUser()

    if (typeof wx.onThemeChange === 'function') {
      wx.onThemeChange(() => theme.onAppThemeChange())
    }
  }
})
