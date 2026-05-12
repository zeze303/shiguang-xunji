const { fetchPostsCloud } = require('../../utils/cloud')
const { updateTabBar } = require('../../utils/tabbar')
const { getStatusMeta, normalizeStatus } = require('../../utils/post-config')
const theme = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-light',
    themeToggleLabel: '浅色',

    quickActions: [
      { title: '全部信息', desc: '查看最新失物招领信息', icon: 'icon-search.svg', type: 'all', category: '全部', status: 'all' },
      { title: '证件专区', desc: '身份证、校园卡等高频物品', icon: 'icon-cat-id.svg', type: 'all', category: '证件', status: 'all' },
      { title: '展示中', desc: '查看当前公开展示中的记录', icon: 'icon-stats-pending.svg', type: 'all', category: '全部', status: 'published' },
      { title: '已完成', desc: '查看已成功找回或认领的信息', icon: 'icon-stats-done.svg', type: 'all', category: '全部', status: 'resolved' }
    ],
    activeQuickAction: '全部信息',
    latestList: [],
    stats: {
      total: 0,
      published: 0,
      resolved: 0,
      reviewing: 0
    },
    pageScrollTop: 0
  },

  onLoad() {
    theme.applyPageTheme(this)
    this.syncThemeToggleLabel()
    this.loadData()
  },

  onShow() {
    theme.applyPageTheme(this)
    this.syncThemeToggleLabel()
    updateTabBar(this, 0)
    this.loadData()
  },

  syncThemeToggleLabel() {
    this.setData({ themeToggleLabel: theme.getPreferenceLabel() })
  },

  onThemeFabTap() {
    theme.cyclePreference()
    theme.refreshAfterPreferenceChange()
    wx.showToast({
      title: '外观：' + theme.getPreferenceLabel(),
      icon: 'none'
    })
  },

  onPageScroll(e) {
    this.setData({ pageScrollTop: e.scrollTop || 0 })
  },

  normalizeList(list) {
    return list.map(item => {
      const normalizedStatus = normalizeStatus(item.status, item.auditStatus)
      const statusMeta = getStatusMeta(normalizedStatus, item.auditStatus)
      return {
        ...item,
        status: normalizedStatus,
        statusText: statusMeta.label,
        statusTone: statusMeta.tone,
        description: item.description || '暂无补充说明',
        location: item.location || '地点未填写'
      }
    })
  },

  buildStats(list) {
    const stats = {
      total: list.length,
      published: 0,
      resolved: 0,
      reviewing: 0
    }

    for (let i = 0; i < list.length; i += 1) {
      const item = list[i]
      const status = normalizeStatus(item.status, item.auditStatus)
      if (status === 'published') stats.published += 1
      if (status === 'resolved') stats.resolved += 1
      if (status === 'reviewing') stats.reviewing += 1
    }

    return stats
  },

  async loadData() {
    try {
      const list = this.normalizeList(await fetchPostsCloud())
      this.setData({
        latestList: list.slice(0, 6),
        stats: this.buildStats(list)
      })
    } catch (error) {
      console.error('首页数据加载失败：', error)
      this.setData({
        latestList: [],
        stats: {
          total: 0,
          published: 0,
          resolved: 0,
          reviewing: 0
        }
      })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  handlePublish(e) {
    const type = e.currentTarget.dataset.type
    const app = getApp()
    app.globalData.publishType = type || 'found'
    wx.switchTab({ url: '/pages/publish/publish' })
  },

  handleQuickFilter(e) {
    const { title, type, category, status } = e.currentTarget.dataset
    this.setData({
      activeQuickAction: title || '全部信息'
    })
    const app = getApp()
    app.globalData.listFilter = {
      fromHome: true,
      type: type || 'all',
      category: category || '全部',
      status: status || 'all'
    }
    wx.switchTab({ url: '/pages/list/list' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  goList() {
    wx.switchTab({ url: '/pages/list/list' })
  },

  onTabRepeat() {
    this.loadData()
    wx.showToast({ title: '首页已刷新', icon: 'none' })
  }
})
