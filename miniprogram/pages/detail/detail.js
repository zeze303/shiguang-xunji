const { fetchPostDetailCloud, updatePostStatusCloud, deletePostCloud, getOpenId, isAdmin } = require('../../utils/cloud')
const {
  getStatusMeta,
  getAuditMeta,
  getStatusFlow,
  getAuditReasonText,
  normalizeStatus,
  ERROR_CODES,
  getErrorMessage
} = require('../../utils/post-config')
const theme = require('../../utils/theme')

function refreshPrevPage() {
  const pages = getCurrentPages()
  const prevPage = pages[pages.length - 2]
  if (prevPage && typeof prevPage.loadData === 'function') {
    prevPage.loadData()
  }
}

function formatTimeLabel(value) {
  if (!value) return ''
  if (typeof value === 'string') return value

  const date = new Date(value)
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const h = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${mm}`
}

Page({
  data: {
    themeClass: 'theme-light',
    detail: null,
    isOwner: false,
    isAdmin: false,
    statusMeta: null,
    auditMeta: null,
    statusFlow: [],
    auditReasonText: '',
    timelineFields: []
  },

  onLoad(options) {
    theme.applyPageTheme(this)
    this.id = options.id
    this.loadData()
  },

  onShow() {
    theme.applyPageTheme(this)
    this.loadData()
  },

  buildTimeline(detail) {
    const fields = [
      { label: '提交时间', value: formatTimeLabel(detail.createdAtText || detail.createdAt) },
      { label: '更新时间', value: formatTimeLabel(detail.updatedAtText || detail.updatedAt) }
    ]

    if (detail.auditAt) {
      fields.push({ label: '审核时间', value: formatTimeLabel(detail.auditAt) })
    }
    if (detail.publishedAt) {
      fields.push({ label: '展示时间', value: formatTimeLabel(detail.publishedAt) })
    }
    if (detail.resolvedAt) {
      fields.push({ label: '完成时间', value: formatTimeLabel(detail.resolvedAt) })
    }
    if (detail.closedAt) {
      fields.push({ label: '关闭时间', value: formatTimeLabel(detail.closedAt) })
    }

    return fields.filter(item => !!item.value)
  },

  buildDetailState(detail, openid, admin) {
    const statusKey = detail && detail.auditStatus === 'rejected'
      ? 'rejected'
      : normalizeStatus(detail && detail.status, detail && detail.auditStatus)
    const flow = getStatusFlow(statusKey, detail && detail.auditStatus).map(item => ({
      ...item,
      icon: item.key === 'reviewing' || item.key === 'pending'
        ? '/images/icon-status-pending.svg'
        : item.key === 'resolved'
          ? '/images/icon-status-resolved.svg'
          : ''
    }))
    return {
      detail,
      isOwner: detail ? detail.userId === openid : false,
      isAdmin: admin,
      statusMeta: getStatusMeta(statusKey, detail && detail.auditStatus),
      auditMeta: getAuditMeta(detail && detail.auditStatus),
      statusFlow: flow,
      auditReasonText: getAuditReasonText(detail || {}),
      timelineFields: detail ? this.buildTimeline(detail) : []
    }
  },

  async loadData() {
    try {
      const detail = await fetchPostDetailCloud(this.id)
      const openid = await getOpenId()
      const admin = await isAdmin(openid)
      this.setData(this.buildDetailState(detail, openid, admin))
    } catch (error) {
      console.error('详情云读取失败：', error)
      wx.showToast({ title: getErrorMessage(ERROR_CODES.DETAIL_LOAD_FAILED), icon: 'none' })
    }
  },

  previewImage(e) {
    if (!this.data.detail || !this.data.detail.images) return
    const current = e.currentTarget.dataset.url
    wx.previewImage({ current, urls: this.data.detail.images })
  },

  copyContact() {
    if (!this.data.detail || !this.data.detail.contact) return
    wx.setClipboardData({
      data: this.data.detail.contact,
      success: () => {
        wx.showToast({ title: '联系信息已复制', icon: 'success' })
      },
      fail: error => {
        console.error('复制联系信息失败：', error)
        wx.showToast({ title: getErrorMessage(ERROR_CODES.COPY_CONTACT_FAILED), icon: 'none' })
      }
    })
  },

  contactUser() {
    if (!this.data.detail || this.data.isOwner) return
    wx.showModal({
      title: '联系方式',
      content: this.data.detail.contact,
      confirmText: '关闭',
      showCancel: false
    })
  },

  markResolved() {
    if (!this.data.detail) return
    wx.showModal({
      title: '确认完成',
      content: '确认后，这条信息将被标记为“已完成”，并在详情中显示状态流转记录。',
      confirmText: '确认完成',
      confirmColor: '#10B981',
      cancelText: '再想想',
      success: async res => {
        if (!res.confirm) return
        try {
          await updatePostStatusCloud(this.id, 'resolved')
          refreshPrevPage()
          await this.loadData()
          wx.showToast({ title: '已标记完成', icon: 'success' })
        } catch (error) {
          console.error('更新状态失败：', error)
          wx.showToast({ title: getErrorMessage(ERROR_CODES.STATUS_UPDATE_FAILED), icon: 'none' })
        }
      }
    })
  },

  closePost() {
    if (!this.data.detail) return
    wx.showModal({
      title: '确认关闭',
      content: '关闭后这条信息会停止展示。',
      confirmText: '确认关闭',
      confirmColor: '#6B7280',
      cancelText: '取消',
      success: async res => {
        if (!res.confirm) return
        try {
          await updatePostStatusCloud(this.id, 'closed')
          refreshPrevPage()
          await this.loadData()
          wx.showToast({ title: '已关闭', icon: 'success' })
        } catch (error) {
          console.error('关闭失败：', error)
          wx.showToast({ title: getErrorMessage(ERROR_CODES.STATUS_UPDATE_FAILED), icon: 'none' })
        }
      }
    })
  },

  reopenPost() {
    if (!this.data.detail) return
    if (this.data.detail.auditStatus !== 'approved') {
      wx.showToast({ title: '仅审核通过的信息可恢复展示', icon: 'none' })
      return
    }

    wx.showModal({
      title: '重新展示',
      content: '确认恢复展示吗？',
      confirmText: '确认恢复',
      confirmColor: '#2F6DF6',
      cancelText: '取消',
      success: async res => {
        if (!res.confirm) return
        try {
          await updatePostStatusCloud(this.id, 'published')
          refreshPrevPage()
          await this.loadData()
          wx.showToast({ title: '已恢复展示', icon: 'success' })
        } catch (error) {
          console.error('恢复展示失败：', error)
          wx.showToast({ title: getErrorMessage(ERROR_CODES.STATUS_UPDATE_FAILED), icon: 'none' })
        }
      }
    })
  },

  removePost() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复。',
      confirmText: '确认删除',
      confirmColor: '#EF4444',
      cancelText: '取消',
      success: async res => {
        if (!res.confirm) return
        try {
          await deletePostCloud(this.id)
          refreshPrevPage()
          wx.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 500)
        } catch (error) {
          console.error('删除失败：', error)
          wx.showToast({ title: getErrorMessage(ERROR_CODES.DELETE_POST_FAILED), icon: 'none' })
        }
      }
    })
  }
})
