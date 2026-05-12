const STORAGE_KEY = 'sgxw_posts'
const USER_KEY = 'sgxw_user'
const LAST_CREATED_KEY = 'sgxw_last_created'
const HIGHLIGHT_DURATION = 5000
const { mockPosts } = require('./mock')
const { STORAGE_KEYS, safeTrim } = require('./post-config')

function getDefaultUser() {
  return {
    id: 'local-user-001',
    nickName: '我',
    avatarText: '我'
  }
}

function ensureUser() {
  let user = wx.getStorageSync(USER_KEY)
  if (!user) {
    user = getDefaultUser()
    wx.setStorageSync(USER_KEY, user)
  }
  return user
}

function normalizePost(item) {
  const auditStatus = item.auditStatus || 'pending'
  const status = item.status === 'pending'
    ? (auditStatus === 'approved' ? 'published' : 'reviewing')
    : (item.status || 'reviewing')

  return {
    images: [],
    createdAt: '刚刚',
    updatedAt: item.updatedAt || item.createdAt || Date.now(),
    auditAt: 0,
    publishedAt: 0,
    resolvedAt: 0,
    closedAt: 0,
    auditStatus,
    auditRemark: item.auditRemark || '',
    ...item,
    status,
    images: Array.isArray(item.images) ? item.images : []
  }
}

function initPosts() {
  const posts = wx.getStorageSync(STORAGE_KEY)
  if (!posts || !Array.isArray(posts)) {
    wx.setStorageSync(STORAGE_KEY, [])
    return []
  }
  return posts.map(normalizePost)
}

function getPosts() {
  return (wx.getStorageSync(STORAGE_KEY) || []).map(normalizePost)
}

function savePosts(list) {
  wx.setStorageSync(STORAGE_KEY, list.map(normalizePost))
}

function clearLocalPosts() {
  wx.setStorageSync(STORAGE_KEY, [])
}

function setLastCreatedPost(id) {
  wx.setStorageSync(LAST_CREATED_KEY, {
    id,
    expireAt: Date.now() + HIGHLIGHT_DURATION
  })
}

function getLastCreatedPostData() {
  const data = wx.getStorageSync(LAST_CREATED_KEY)
  if (!data || !data.id || !data.expireAt) return null
  if (Date.now() >= data.expireAt) {
    wx.removeStorageSync(LAST_CREATED_KEY)
    return null
  }
  return data
}

function getLastCreatedPostId() {
  const data = getLastCreatedPostData()
  return data ? data.id : ''
}

function getHighlightRemainingTime() {
  const data = getLastCreatedPostData()
  if (!data) return 0
  return Math.max(data.expireAt - Date.now(), 0)
}

function clearLastCreatedPostId() {
  wx.removeStorageSync(LAST_CREATED_KEY)
}

function buildDraftPayload(form = {}, extra = {}) {
  return {
    type: extra.type || 'found',
    categoryIndex: Number(extra.categoryIndex || 0),
    contactTypeIndex: Number(extra.contactTypeIndex || 0),
    imageList: Array.isArray(extra.imageList) ? extra.imageList : [],
    form: {
      title: safeTrim(form.title),
      itemName: safeTrim(form.itemName),
      location: safeTrim(form.location),
      date: form.date || '',
      clock: form.clock || '',
      time: form.time || '',
      contactType: form.contactType || '微信',
      contactCustomType: safeTrim(form.contactCustomType),
      contactValue: safeTrim(form.contactValue),
      description: safeTrim(form.description)
    },
    updatedAt: Date.now()
  }
}

function hasMeaningfulDraft(draft) {
  if (!draft || !draft.form) return false
  const form = draft.form
  const fields = [
    form.title,
    form.itemName,
    form.location,
    form.contactCustomType,
    form.contactValue,
    form.description
  ]
  if ((draft.imageList || []).length) return true
  return fields.some(item => !!safeTrim(item))
}

function savePublishDraft(form, extra) {
  const draft = buildDraftPayload(form, extra)
  if (!hasMeaningfulDraft(draft)) {
    clearPublishDraft()
    return null
  }
  wx.setStorageSync(STORAGE_KEYS.draft, draft)
  wx.setStorageSync(STORAGE_KEYS.draftMeta, {
    updatedAt: draft.updatedAt,
    hasImage: draft.imageList.length > 0
  })
  return draft
}

function getPublishDraft() {
  const draft = wx.getStorageSync(STORAGE_KEYS.draft)
  if (!draft || typeof draft !== 'object') return null
  return buildDraftPayload(draft.form || {}, draft)
}

function getPublishDraftMeta() {
  const meta = wx.getStorageSync(STORAGE_KEYS.draftMeta)
  if (!meta || typeof meta !== 'object') return null
  return {
    updatedAt: meta.updatedAt || 0,
    hasImage: !!meta.hasImage
  }
}

function clearPublishDraft() {
  wx.removeStorageSync(STORAGE_KEYS.draft)
  wx.removeStorageSync(STORAGE_KEYS.draftMeta)
}

function createPost(data) {
  const user = ensureUser()
  const list = initPosts()
  const now = Date.now()
  const item = {
    id: String(now),
    title: data.title,
    itemName: data.itemName,
    type: data.type,
    category: data.category,
    images: data.images || [],
    location: data.location,
    time: data.time,
    contact: data.contact,
    description: data.description || '',
    status: 'reviewing',
    auditStatus: 'pending',
    auditRemark: '本地记录已创建，等待云端审核结果同步。',
    userId: user.id,
    userName: user.nickName,
    createdAt: '刚刚',
    updatedAt: now,
    auditAt: 0,
    publishedAt: 0,
    resolvedAt: 0,
    closedAt: 0
  }
  const newList = [item, ...list]
  savePosts(newList)
  setLastCreatedPost(item.id)
  return item
}

function getPostById(id) {
  const list = initPosts()
  return list.find(item => item.id === id)
}

function updatePostStatus(id, status) {
  const now = Date.now()
  const list = initPosts().map(item => {
    if (item.id !== id) {
      return item
    }

    const nextItem = {
      ...item,
      status,
      updatedAt: now
    }

    if (status === 'resolved') {
      nextItem.resolvedAt = now
    }
    if (status === 'closed') {
      nextItem.closedAt = now
    }
    if (status === 'published') {
      nextItem.publishedAt = now
    }

    return nextItem
  })
  savePosts(list)
}

function deletePost(id) {
  const list = initPosts().filter(item => item.id !== id)
  savePosts(list)
  if (getLastCreatedPostId() === id) {
    clearLastCreatedPostId()
  }
}

function getMyPosts() {
  const user = ensureUser()
  return initPosts().filter(item => item.userId === user.id)
}

module.exports = {
  ensureUser,
  initPosts,
  getPosts,
  savePosts,
  clearLocalPosts,
  savePublishDraft,
  getPublishDraft,
  getPublishDraftMeta,
  clearPublishDraft,
  hasMeaningfulDraft,
  createPost,
  getPostById,
  updatePostStatus,
  deletePost,
  getMyPosts,
  getLastCreatedPostId,
  getHighlightRemainingTime,
  clearLastCreatedPostId,
  HIGHLIGHT_DURATION
}
