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

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    const info = this.data.userInfo || {}
    info.avatarUrl = avatarUrl
    this.setData({ userInfo: { ...info } })
    this.saveProfile({ avatarUrl })
  },

  onNicknameBlur(e) {
    const nickName = e.detail.value
    const info = this.data.userInfo || {}
    if (!nickName || nickName === info.nickName) return
    info.nickName = nickName
    this.setData({ userInfo: { ...info } })
    this.saveProfile({ nickName })
  },

  async saveProfile(partial) {
    if (this._saving) return
    this._saving = true
    try {
      const cur = this.data.userInfo || {}
      const data = {
        nickName: partial.nickName || cur.nickName || '微信用户',
        avatarUrl: partial.avatarUrl || cur.avatarUrl || ''
      }
      const saved = await saveUserProfileCloud(data)
      this.setData({ userInfo: saved })
      wx.showToast({ title: '资料已更新', icon: 'success' })
    } catch (error) {
      console.error('保存头像昵称失败：', error)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this._saving = false
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
