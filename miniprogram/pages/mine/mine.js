const { getUserProfileCloud, saveUserProfileCloud, getOpenId, isAdmin } = require('../../utils/cloud')
const { updateTabBar } = require('../../utils/tabbar')
const theme = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-light',
    userInfo: null,
    openid: '',
    isAdmin: false,
    pageScrollTop: 0,
    menuList: [
      {
        key: 'posts',
        title: '我的登记',
        desc: '查看登记记录和状态',
        url: '/pages/my-posts/my-posts',
        icon: '/images/icon-menu-posts.svg',
        accent: true
      },
      {
        key: 'publish',
        title: '登记信息',
        desc: '提交寻物或招领登记',
        switchTab: '/pages/publish/publish',
        icon: '/images/icon-publish.svg',
        accent: true
      }
    ]
  },

  onLoad() {
    theme.applyPageTheme(this)
    this.loadProfile()
  },

  onShow() {
    theme.applyPageTheme(this)
    updateTabBar(this, 3)
    this.loadProfile()
  },

  onPageScroll(e) {
    this.setData({ pageScrollTop: e.scrollTop || 0 })
  },

  async loadProfile() {
    try {
      const [profile, openid] = await Promise.all([getUserProfileCloud(), getOpenId()])
      const admin = await isAdmin(openid)
      this.setData({
        userInfo: profile || {
          nickName: '微信用户',
          avatarUrl: ''
        },
        openid: openid || '',
        isAdmin: admin
      })
    } catch (error) {
      console.error('个人信息加载失败：', error)
      wx.showToast({ title: '个人信息加载失败', icon: 'none' })
    }
  },

  async handleGetProfile() {
    if (this.data._profileLock) {
      wx.showToast({ title: '操作过于频繁，请稍后再试', icon: 'none' })
      return
    }
    this.setData({ _profileLock: true })
    try {
      const profile = await wx.getUserProfile({ desc: '用于展示昵称和头像' })
      const saved = await saveUserProfileCloud(profile.userInfo || {})
      this.setData({ userInfo: saved, _profileLock: false })
      wx.showToast({ title: '资料已更新', icon: 'success' })
    } catch (error) {
      if (error && /cancel/i.test(String(error.errMsg || error.message || ''))) {
        this.setData({ _profileLock: false })
        return
      }
      this.setData({ _profileLock: false })
      console.error('获取头像昵称失败：', error)
      wx.showToast({ title: '更新失败', icon: 'none' })
    }
  },

  goMenu(e) {
    const { url, switchTab } = e.currentTarget.dataset
    if (switchTab) {
      wx.switchTab({ url: switchTab })
      return
    }
    if (url) {
      wx.navigateTo({ url })
    }
  },

  copyOpenid() {
    const openid = this.data.openid
    if (!openid) {
      wx.showToast({ title: '未获取到 OpenID', icon: 'none' })
      return
    }

    wx.setClipboardData({
      data: openid,
      success: () => {
        wx.showToast({ title: 'OpenID 已复制', icon: 'success' })
      },
      fail: error => {
        console.error('复制 openid 失败：', error)
        wx.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  onTabRepeat() {
    this.loadProfile()
    wx.showToast({ title: '已刷新', icon: 'none' })
  }
})
