const { createPostCloud, getOpenId } = require('../../utils/cloud')
const { createPost, savePublishDraft, getPublishDraft, clearPublishDraft } = require('../../utils/storage')
const { updateTabBar } = require('../../utils/tabbar')
const {
  CATEGORY_OPTIONS,
  CONTACT_TYPE_OPTIONS,
  buildContactText,
  safeTrim,
  getContactRule,
  hitRiskyWord,
  ERROR_CODES,
  getErrorMessage,
  CATEGORY_ICON_MAP
} = require('../../utils/post-config')
const theme = require('../../utils/theme')

const initialForm = () => ({
  title: '',
  itemName: '',
  location: '',
  date: '',
  clock: '',
  time: '',
  contactType: '微信',
  contactCustomType: '',
  contactValue: '',
  description: ''
})

function formatNow() {
  const now = new Date()
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  const h = `${now.getHours()}`.padStart(2, '0')
  const mm = `${now.getMinutes()}`.padStart(2, '0')
  return {
    date: `${y}-${m}-${d}`,
    clock: `${h}:${mm}`,
    time: `${y}-${m}-${d} ${h}:${mm}`
  }
}

function formatDraftTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const h = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  const isToday = y === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  return isToday ? `今天 ${h}:${mm}` : `${y}-${m}-${d} ${h}:${mm}`
}

function clampLength(value, max) {
  return String(value || '').slice(0, max)
}

Page({
  data: {
    themeClass: 'theme-light',
    type: 'found',
    categories: CATEGORY_OPTIONS,
    categoryIcons: CATEGORY_OPTIONS.map(c => CATEGORY_ICON_MAP[c] || 'icon-cat-other.svg'),
    categoryIndex: 0,
    contactTypes: CONTACT_TYPE_OPTIONS,
    contactTypeIndex: 0,
    form: initialForm(),
    imageList: [],
    errors: {},
    draftTip: '',
    draftRestored: false,
    submitting: false,
    hasDraft: false,
    draftSavedAt: 0,
    draftTimeText: '',
    openidReady: false,
    checkingOpenId: false,
    pageScrollTop: 0
  },

  onLoad(options) {
    theme.applyPageTheme(this)
    if (options.type) {
      this.setData({ type: options.type })
    }

    const now = formatNow()
    this.setData({
      'form.date': now.date,
      'form.clock': now.clock,
      'form.time': now.time
    })
    this.restoreDraftIfNeeded()
  },

  onShow() {
    theme.applyPageTheme(this)
    updateTabBar(this, 2)
    const app = getApp()
    const publishType = app.globalData && app.globalData.publishType
    if (publishType) {
      this.setData({ type: publishType })
      app.globalData.publishType = ''
    }
    this.checkOpenIdStatus()
  },

  onHide() {
    this.saveDraftSilently()
  },

  onPageScroll(e) {
    this.setData({ pageScrollTop: e.scrollTop || 0 })
  },

  onUnload() {
    this.saveDraftSilently()
  },

  async checkOpenIdStatus(showHint = false) {
    if (this.data.checkingOpenId) {
      return this.data.openidReady
    }

    this.setData({ checkingOpenId: true })
    try {
      const openid = await getOpenId()
      const ready = !!openid
      this.setData({
        openidReady: ready,
        checkingOpenId: false
      })

      if (showHint) {
        wx.showToast({
          title: ready ? '已获取 OpenID' : '暂未获取到 OpenID',
          icon: 'none'
        })
      }
      return ready
    } catch (error) {
      console.error('检测 OpenID 失败：', error)
      this.setData({
        openidReady: false,
        checkingOpenId: false
      })
      if (showHint) {
        wx.showToast({
          title: '获取 OpenID 失败，请稍后重试',
          icon: 'none'
        })
      }
      return false
    }
  },

  retryOpenId() {
    this.checkOpenIdStatus(true)
  },

  restoreDraftIfNeeded() {
    try {
      const draft = getPublishDraft()
      if (!draft) return

      this.setData({
        type: draft.type || this.data.type,
        categoryIndex: Number(draft.categoryIndex || 0),
        contactTypeIndex: Number(draft.contactTypeIndex || 0),
        form: {
          ...this.data.form,
          ...(draft.form || {})
        },
        imageList: Array.isArray(draft.imageList) ? draft.imageList : [],
        draftRestored: true,
        hasDraft: true,
        draftSavedAt: draft.updatedAt || 0,
        draftTimeText: formatDraftTime(draft.updatedAt)
      })
      this.updateDraftTip()
      wx.showToast({ title: '已恢复草稿', icon: 'none' })
    } catch (error) {
      console.error('草稿恢复失败：', error)
      wx.showToast({ title: getErrorMessage(ERROR_CODES.DRAFT_LOAD_FAILED), icon: 'none' })
    }
  },

  saveDraftSilently() {
    try {
      const draft = savePublishDraft(this.data.form, {
        type: this.data.type,
        categoryIndex: this.data.categoryIndex,
        contactTypeIndex: this.data.contactTypeIndex,
        imageList: this.data.imageList
      })

      if (!draft) {
        this.setData({
          hasDraft: false,
          draftSavedAt: 0,
          draftTimeText: ''
        })
        return
      }

      this.setData({
        hasDraft: true,
        draftSavedAt: draft.updatedAt,
        draftTimeText: formatDraftTime(draft.updatedAt)
      })
    } catch (error) {
      console.error('草稿保存失败：', error)
    }
  },

  clearDraft() {
    if (!this.data.hasDraft && !this.hasCurrentInput()) {
      wx.showToast({ title: '没有可清空的草稿', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认清空草稿？',
      content: '清空后内容将无法恢复。',
      confirmText: '清空',
      confirmColor: '#EF4444',
      cancelText: '取消',
      success: res => {
        if (!res.confirm) return
        this.resetForm()
        wx.showToast({ title: '草稿已清空', icon: 'success' })
      }
    })
  },

  hasCurrentInput() {
    const { form, imageList } = this.data
    const fields = [
      form.title,
      form.itemName,
      form.location,
      form.contactCustomType,
      form.contactValue,
      form.description
    ]
    return imageList.length > 0 || fields.some(item => !!safeTrim(item))
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ type })
    this.saveDraftSilently()
  },

  pickCategory(e) {
    this.setData({ categoryIndex: Number(e.detail.value) })
    this.saveDraftSilently()
  },

  pickDate(e) {
    const date = e.detail.value
    this.setData({
      'form.date': date,
      'form.time': `${date} ${this.data.form.clock}`
    })
    this.clearFieldError('time')
    this.saveDraftSilently()
  },

  pickClock(e) {
    const clock = e.detail.value
    this.setData({
      'form.clock': clock,
      'form.time': `${this.data.form.date} ${clock}`
    })
    this.clearFieldError('time')
    this.saveDraftSilently()
  },

  pickContactType(e) {
    const index = Number(e.detail.value)
    const type = this.data.contactTypes[index]
    this.setData({
      contactTypeIndex: index,
      'form.contactType': type,
      'form.contactCustomType': type === '其他' ? this.data.form.contactCustomType : ''
    })
    this.clearFieldError('contactType')
    this.clearFieldError('contactValue')
    this.saveDraftSilently()
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const maxMap = {
      title: 30,
      itemName: 20,
      location: 30,
      contactCustomType: 10,
      contactValue: 30,
      description: 200
    }
    const value = clampLength(e.detail.value, maxMap[field] || 100)

    this.setData({
      [`form.${field}`]: value
    })
    this.clearFieldError(field)

    if (field === 'description' || field === 'title' || field === 'itemName') {
      this.updateDraftTip()
    }

    this.saveDraftSilently()
  },

  updateDraftTip() {
    const form = this.data.form
    const riskyWord = hitRiskyWord([form.title, form.itemName, form.location, form.contactValue, form.description])
    this.setData({
      draftTip: riskyWord ? `内容里含有敏感词“${riskyWord}”，提交后可能无法通过审核` : ''
    })
  },

  clearFieldError(field) {
    const errors = { ...this.data.errors }
    delete errors[field]
    if (field === 'contactCustomType') delete errors.contactType
    if (field === 'contactValue') delete errors.contactValue
    this.setData({ errors })
  },

  getFinalContactType() {
    const { contactType, contactCustomType } = this.data.form
    return contactType === '其他' ? safeTrim(contactCustomType) : contactType
  },

  validateContact(finalContactType, contactValue, errors) {
    const rule = getContactRule(finalContactType)
    const value = safeTrim(contactValue)
    if (!value) {
      errors.contactValue = '请输入联系方式内容'
      return
    }
    if (value.length < rule.min || value.length > rule.max || !rule.pattern.test(value)) {
      errors.contactValue = rule.tip || getErrorMessage(ERROR_CODES.INVALID_CONTACT)
    }
  },

  validateForm() {
    const { title, itemName, location, time, contactType, contactCustomType, contactValue } = this.data.form
    const errors = {}
    const finalContactType = this.getFinalContactType()

    if (!safeTrim(title)) errors.title = '请输入标题'
    if (!safeTrim(itemName)) errors.itemName = '请输入物品名称'
    if (!safeTrim(location)) errors.location = '请输入地点'
    if (!safeTrim(time)) errors.time = '请选择时间'
    if (contactType === '其他' && !safeTrim(contactCustomType)) errors.contactType = '请输入自定义联系方式类型'
    if (contactType === '其他' && safeTrim(contactCustomType).length > 10) errors.contactType = '自定义联系方式类型最多10个字'

    this.validateContact(finalContactType || '其他', contactValue, errors)

    this.setData({ errors })

    const firstError = Object.values(errors)[0]
    if (firstError) {
      wx.showToast({
        title: firstError,
        icon: 'none'
      })
      return false
    }
    return true
  },

  chooseImage() {
    const remain = 3 - this.data.imageList.length
    if (remain <= 0) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const files = (res.tempFiles || []).map(item => item.tempFilePath).filter(Boolean)
        const merged = [...this.data.imageList, ...files].slice(0, 3)
        this.setData({ imageList: merged })
        this.saveDraftSilently()
      }
    })
  },

  removeImage(e) {
    const index = Number(e.currentTarget.dataset.index)
    const list = [...this.data.imageList]
    list.splice(index, 1)
    this.setData({ imageList: list })
    this.saveDraftSilently()
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.url
    wx.previewImage({
      current,
      urls: this.data.imageList
    })
  },

  buildPayload() {
    const form = this.data.form
    const finalContactType = this.getFinalContactType()
    return {
      title: safeTrim(form.title),
      itemName: safeTrim(form.itemName),
      location: safeTrim(form.location),
      time: safeTrim(form.time),
      contact: buildContactText(finalContactType, form.contactValue),
      description: safeTrim(form.description),
      images: this.data.imageList,
      type: this.data.type,
      category: this.data.categories[this.data.categoryIndex]
    }
  },

  resetForm() {
    const now = formatNow()
    clearPublishDraft()
    this.setData({
      categoryIndex: 0,
      contactTypeIndex: 0,
      form: {
        ...initialForm(),
        date: now.date,
        clock: now.clock,
        time: now.time,
        contactType: '微信'
      },
      imageList: [],
      errors: {},
      draftTip: '',
      draftRestored: false,
      submitting: false,
      hasDraft: false,
      draftSavedAt: 0,
      draftTimeText: ''
    })
  },

  async ensureOpenIdReady() {
    const ready = this.data.openidReady || await this.checkOpenIdStatus()
    if (ready) {
      return true
    }

    wx.showModal({
      title: '暂无法登记',
      content: '暂未获取到 OpenID，请稍后再试，或去“我的”页面查看。',
      confirmText: '去查看',
      success: res => {
        if (!res.confirm) return
        wx.switchTab({ url: '/pages/mine/mine' })
      }
    })
    return false
  },

  onTabRepeat() {
    this.checkOpenIdStatus(true)
  },

  async submitForm() {
    if (!this.validateForm() || this.data.submitting) return
    const ready = await this.ensureOpenIdReady()
    if (!ready) return

    const payload = this.buildPayload()
    this.setData({ submitting: true })
    wx.showLoading({ title: '正在提交...' })

    try {
      await createPostCloud(payload)
      createPost(payload)
      this.resetForm()
      wx.hideLoading()
      wx.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/list/list' })
      }, 500)
    } catch (error) {
      console.error('云提交失败：', error)
      wx.hideLoading()
      this.setData({ submitting: false })
      wx.showModal({
        title: '提交失败',
        content: getErrorMessage(ERROR_CODES.NETWORK_BUSY, '提交未成功，请稍后重试。'),
        showCancel: false
      })
    }
  }
})
