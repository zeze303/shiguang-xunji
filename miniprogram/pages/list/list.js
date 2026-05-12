const { fetchPostsCloud } = require('../../utils/cloud')
const { getLastCreatedPostId, getHighlightRemainingTime } = require('../../utils/storage')
const { updateTabBar } = require('../../utils/tabbar')
const { CATEGORY_WITH_ALL, QUICK_FILTERS, matchPostKeyword, normalizeKeyword, getStatusMeta, normalizeStatus } = require('../../utils/post-config')
const theme = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-light',
    activeTab: 'all',
    keyword: '',
    list: [],
    allList: [],
    activeCategory: '全部',
    statusFilter: 'all',
    categories: CATEGORY_WITH_ALL,
    quickFilters: QUICK_FILTERS,
    emptyTitle: '暂无内容',
    emptyDesc: '换个筛选条件试试。',
    hasFilter: false,
    pageScrollTop: 0
  },

  onLoad() {
    theme.applyPageTheme(this)
    this.loadData()
  },

  onShow() {
    theme.applyPageTheme(this)
    updateTabBar(this, 1)
    this.applyExternalFilter()
    this.loadData()
  },

  onPullDownRefresh() {
    this.applyExternalFilter()
    this.loadData(true)
  },

  onPageScroll(e) {
    this.setData({ pageScrollTop: e.scrollTop || 0 })
  },

  onHide() {
    this.clearHighlightTimer()
  },

  onUnload() {
    this.clearHighlightTimer()
  },

  applyExternalFilter() {
    const app = getApp()
    const filter = app.globalData && app.globalData.listFilter
    if (filter && filter.fromHome) {
      this.setData({
        activeTab: filter.type || 'all',
        activeCategory: filter.category || '全部',
        statusFilter: filter.status || 'all',
        keyword: ''
      })
      app.globalData.listFilter = null
    }
  },

  clearHighlightTimer() {
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer)
      this.highlightTimer = null
    }
  },

  normalizeList(list) {
    return list.map(item => {
      const normalizedStatus = normalizeStatus(item.status, item.auditStatus)
      const statusMeta = getStatusMeta(normalizedStatus, item.auditStatus)
      return {
        ...item,
        status: normalizedStatus,
        title: item.title || '未命名信息',
        itemName: item.itemName || '',
        location: item.location || '地点未填写',
        description: item.description || '暂无补充说明',
        createdAt: item.createdAtText || item.createdAt || '',
        statusText: statusMeta.label,
        statusTone: statusMeta.tone,
        auditFailed: item.auditStatus === 'rejected',
        auditReason: item.auditRemark || ''
      }
    })
  },

  async loadData(fromPull = false) {
    this.clearHighlightTimer()
    try {
      const lastId = getLastCreatedPostId()
      const allList = this.normalizeList(await fetchPostsCloud()).map(item => ({
        ...item,
        isNew: !!lastId && item.id === lastId
      }))
      this.setData({ allList })
      this.filterList(this.data.activeTab, this.data.keyword, this.data.activeCategory, this.data.statusFilter)
    } catch (error) {
      console.error('列表云读取失败：', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      if (fromPull) {
        wx.stopPullDownRefresh()
      }
    }

    const remain = getHighlightRemainingTime()
    if (remain > 0) {
      this.highlightTimer = setTimeout(() => {
        this.loadData()
      }, remain + 50)
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.filterList(tab, this.data.keyword, this.data.activeCategory, this.data.statusFilter)
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category })
    this.filterList(this.data.activeTab, this.data.keyword, category, this.data.statusFilter)
  },

  switchStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ statusFilter: status })
    this.filterList(this.data.activeTab, this.data.keyword, this.data.activeCategory, status)
  },

  onInput(e) {
    const keyword = normalizeKeyword(e.detail.value)
    this.setData({ keyword })
    this.filterList(this.data.activeTab, keyword, this.data.activeCategory, this.data.statusFilter)
  },

  buildEmptyState(tab, keyword, category, statusFilter) {
    const hasKeyword = !!keyword
    const hasCategory = category && category !== '全部'
    const hasStatus = statusFilter && statusFilter !== 'all'
    const hasType = tab && tab !== 'all'

    if (hasKeyword && (hasCategory || hasStatus || hasType)) {
      return {
        title: '未找到符合条件的信息',
        desc: '可尝试更换关键词，或重置筛选条件后再查看。'
      }
    }

    if (hasKeyword) {
      return {
        title: '暂无搜索结果',
        desc: '试试更短的关键词，或换一个物品名称、地点再搜索。'
      }
    }

    if (hasStatus) {
      const statusMap = {
        reviewing: '暂无审核中的信息',
        published: '暂无展示中的信息',
        resolved: '暂无已完成记录',
        closed: '暂无已关闭记录'
      }
      return {
        title: statusMap[statusFilter] || '暂无相关状态信息',
        desc: '你可以切换其他状态筛选，查看更多内容。'
      }
    }

    if (hasCategory || hasType) {
      return {
        title: '当前筛选下暂无信息',
        desc: '可以尝试切换分类或招领/寻物类型。'
      }
    }

    return {
      title: '暂无失物招领信息',
      desc: '当前还没有公开展示的信息，稍后再来看看吧。'
    }
  },

  filterList(tab, keyword, category, statusFilter) {
    let result = this.data.allList.slice()

    if (tab !== 'all') {
      result = result.filter(item => item.type === tab)
    }
    if (category && category !== '全部') {
      result = result.filter(item => item.category === category)
    }
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(item => normalizeStatus(item.status, item.auditStatus) === statusFilter)
    }
    if (keyword) {
      result = result.filter(item => matchPostKeyword(item, keyword))
    }

    const emptyState = this.buildEmptyState(tab, keyword, category, statusFilter)
    const hasFilter = tab !== 'all' || !!keyword || category !== '全部' || statusFilter !== 'all'

    this.setData({
      list: result,
      emptyTitle: emptyState.title,
      emptyDesc: emptyState.desc,
      hasFilter
    })
  },

  resetFilters() {
    this.setData({
      activeTab: 'all',
      keyword: '',
      activeCategory: '全部',
      statusFilter: 'all'
    })
    this.filterList('all', '', '全部', 'all')
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onTabRepeat() {
    this.applyExternalFilter()
    this.loadData()
    wx.showToast({ title: '列表已刷新', icon: 'none' })
  }
})
