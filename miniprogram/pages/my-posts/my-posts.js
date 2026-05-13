const { fetchMyPostsCloud } = require('../../utils/cloud')
const { getStatusMeta, getAuditMeta, getAuditReasonText, normalizeKeyword, normalizeStatus } = require('../../utils/post-config')
const theme = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-light',
    list: [],
    allList: [],
    activeTab: 'all',
    keyword: '',
    myStats: { total: 0, published: 0, reviewing: 0, resolved: 0 },
    emptyTitle: '暂无登记记录',
    emptyDesc: '还没有登记内容。',
    pageScrollTop: 0
  },

  onLoad() {
    theme.applyPageTheme(this)
    this.loadData()
  },

  onShow() {
    theme.applyPageTheme(this)
    this.loadData()
  },

  onPageScroll(e) {
    this.setData({ pageScrollTop: e.scrollTop || 0 })
  },

  normalizeList(list) {
    return list.map(item => {
      const normalizedStatus = normalizeStatus(item.status, item.auditStatus)
      const statusMeta = getStatusMeta(normalizedStatus, item.auditStatus)
      const auditMeta = getAuditMeta(item.auditStatus)
      const auditReasonText = getAuditReasonText(item)

      return {
        ...item,
        timeText: item.time || '',
        status: normalizedStatus,
        statusText: statusMeta.label,
        statusTone: statusMeta.tone,
        statusDesc: statusMeta.desc,
        auditText: auditMeta.label,
        auditTone: auditMeta.tone,
        auditReasonText,
        showRejectReason: item.auditStatus === 'rejected' && !!auditReasonText
      }
    })
  },

  async loadData() {
    try {
      const raw = await fetchMyPostsCloud()
      const allList = this.normalizeList(raw)
      const stats = { total: 0, published: 0, reviewing: 0, resolved: 0 }
      raw.forEach(p => {
        stats.total += 1
        const s = normalizeStatus(p.status, p.auditStatus)
        if (s === 'published') stats.published += 1
        else if (s === 'reviewing') stats.reviewing += 1
        else if (s === 'resolved') stats.resolved += 1
      })
      this.setData({ allList, myStats: stats })
      this.filterList(this.data.activeTab, this.data.keyword)
    } catch (error) {
      console.error('我的发布云读取失败：', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.filterList(tab, this.data.keyword)
  },

  onInput(e) {
    const keyword = normalizeKeyword(e.detail.value)
    this.setData({ keyword })
    this.filterList(this.data.activeTab, keyword)
  },

  buildEmptyState(tab, keyword) {
    if (keyword) {
      return {
        title: '没有找到记录',
        desc: '换个关键词试试。'
      }
    }

    const map = {
      all: {
        title: '暂无登记记录',
        desc: '还没有登记内容。'
      },
      pending: {
        title: '暂无审核中记录',
        desc: '没有审核中的记录。'
      },
      published: {
        title: '暂无展示中的记录',
        desc: '没有展示中的记录。'
      },
      rejected: {
        title: '暂无审核未通过记录',
        desc: '没有未通过的记录。'
      },
      resolved: {
        title: '暂无已完成记录',
        desc: '没有已完成的记录。'
      },
      closed: {
        title: '暂无已关闭记录',
        desc: '没有已关闭的记录。'
      }
    }

    return map[tab] || map.all
  },

  filterList(tab, keyword) {
    let list = this.data.allList.slice()

    if (tab === 'pending') {
      list = list.filter(item => normalizeStatus(item.status, item.auditStatus) === 'reviewing' || item.auditStatus === 'pending')
    }
    if (tab === 'published') {
      list = list.filter(item => normalizeStatus(item.status, item.auditStatus) === 'published')
    }
    if (tab === 'rejected') {
      list = list.filter(item => item.auditStatus === 'rejected')
    }
    if (tab === 'resolved') {
      list = list.filter(item => normalizeStatus(item.status, item.auditStatus) === 'resolved')
    }
    if (tab === 'closed') {
      list = list.filter(item => normalizeStatus(item.status, item.auditStatus) === 'closed')
    }

    if (keyword) {
      list = list.filter(item => {
        const text = [item.title, item.itemName, item.location, item.description, item.auditReasonText]
          .map(value => normalizeKeyword(value))
          .join(' ')
        return text.indexOf(keyword) > -1
      })
    }

    const emptyState = this.buildEmptyState(tab, keyword)

    this.setData({
      list,
      emptyTitle: emptyState.title,
      emptyDesc: emptyState.desc
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onTabRepeat() {
    this.loadData()
    wx.showToast({ title: '已刷新', icon: 'none' })
  }
})
