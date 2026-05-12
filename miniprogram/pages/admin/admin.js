const { fetchAllPostsCloud, deletePostCloud, updateAuditStatusCloud } = require('../../utils/cloud')
const { getStatusMeta, getAuditMeta, getAuditReasonText, normalizeKeyword, normalizeStatus } = require('../../utils/post-config')
const theme = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-light',
    list: [],
    allList: [],
    activeTab: 'all',
    keyword: '',
    emptyTitle: '暂无内容',
    emptyDesc: '当前条件下没有记录。',
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
      const auditMeta = getAuditMeta(item.auditStatus)
      const statusMeta = getStatusMeta(normalizedStatus, item.auditStatus)
      return {
        ...item,
        status: normalizedStatus,
        auditText: auditMeta.label,
        auditTone: auditMeta.tone,
        auditReasonText: getAuditReasonText(item),
        statusText: statusMeta.label,
        statusTone: statusMeta.tone
      }
    })
  },

  async loadData() {
    try {
      const allList = this.normalizeList(await fetchAllPostsCloud())
      this.setData({ allList })
      this.filterList(this.data.activeTab, this.data.keyword)
    } catch (error) {
      console.error('管理中心加载失败：', error)
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
        title: '暂无内容',
        desc: '还没有记录。'
      },
      pending: {
        title: '暂无审核中记录',
        desc: '没有审核中的记录。'
      },
      approved: {
        title: '暂无审核通过记录',
        desc: '没有已通过的记录。'
      },
      rejected: {
        title: '暂无审核未通过记录',
        desc: '没有未通过的记录。'
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
    if (tab === 'approved') {
      list = list.filter(item => item.auditStatus === 'approved')
    }
    if (tab === 'rejected') {
      list = list.filter(item => item.auditStatus === 'rejected')
    }
    if (tab === 'closed') {
      list = list.filter(item => normalizeStatus(item.status, item.auditStatus) === 'closed')
    }

    if (keyword) {
      list = list.filter(item => {
        const text = [
          item.title,
          item.itemName,
          item.location,
          item.userName,
          item.userId,
          item.auditReasonText,
          item.description
        ]
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
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  async approveItem(e) {
    const id = e.currentTarget.dataset.id
    try {
      await updateAuditStatusCloud(id, 'approved', '审核通过')
      wx.showToast({ title: '已通过审核', icon: 'success' })
      this.loadData()
    } catch (error) {
      console.error('审核通过失败：', error)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  async rejectItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '驳回确认',
      content: '确认将该信息标记为审核未通过吗？',
      confirmText: '确认驳回',
      confirmColor: '#EF4444',
      success: async res => {
        if (!res.confirm) return
        try {
          await updateAuditStatusCloud(id, 'rejected', '审核未通过')
          wx.showToast({ title: '已驳回', icon: 'success' })
          this.loadData()
        } catch (error) {
          console.error('审核驳回失败：', error)
          wx.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    })
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '管理员删除',
      content: '确认删除这条信息吗？删除后数据和图片将一起移除。',
      confirmText: '确认删除',
      confirmColor: '#EF4444',
      success: async res => {
        if (!res.confirm) return
        try {
          await deletePostCloud(id)
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.loadData()
        } catch (error) {
          console.error('管理员删除失败：', error)
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  },

  onTabRepeat() {
    this.loadData()
    wx.showToast({ title: '已刷新', icon: 'none' })
  }
})
