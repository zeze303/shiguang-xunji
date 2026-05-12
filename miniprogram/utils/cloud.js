const { hitRiskyWord, safeTrim } = require('./post-config')

const db = wx.cloud.database()
const _ = db.command
const posts = db.collection('posts')
const users = db.collection('userProfiles')
const admins = db.collection('admins')

function normalizeCloudPost(item) {
  return {
    id: item._id,
    _id: item._id,
    title: item.title || '',
    itemName: item.itemName || '',
    type: item.type || 'found',
    category: item.category || '其他',
    images: Array.isArray(item.images) ? item.images : [],
    location: item.location || '',
    time: item.time || '',
    contact: item.contact || '',
    description: item.description || '',
    status: item.status || 'pending',
    auditStatus: item.auditStatus || 'pending',
    auditRemark: item.auditRemark || '',
    userId: item._openid || item.userId || '',
    userName: item.userName || '微信用户',
    avatarUrl: item.avatarUrl || '',
    createdAt: item.createdAt || Date.now(),
    updatedAt: item.updatedAt || item.createdAt || Date.now(),
    auditAt: item.auditAt || 0,
    publishedAt: item.publishedAt || 0,
    resolvedAt: item.resolvedAt || 0,
    closedAt: item.closedAt || 0
  }
}

function formatCreatedAt(ts) {
  if (!ts) return '刚刚'
  const now = Date.now()
  const diff = now - ts
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}小时前`
  return `${Math.max(1, Math.floor(diff / day))}天前`
}

async function mapCloudFileIDs(images = []) {
  const cloudIds = []
  for (let i = 0; i < images.length; i += 1) {
    if (typeof images[i] === 'string' && images[i].indexOf('cloud://') === 0) {
      cloudIds.push(images[i])
    }
  }

  if (!cloudIds.length) return images

  const res = await wx.cloud.callFunction({
    name: 'getTempFileURL',
    data: { fileList: cloudIds }
  })

  const fileList = (res.result && res.result.fileList) || []
  const urlMap = {}
  for (let i = 0; i < fileList.length; i += 1) {
    urlMap[fileList[i].fileID] = fileList[i].tempFileURL || ''
  }

  return images.map(item => {
    if (typeof item === 'string' && item.indexOf('cloud://') === 0) {
      return urlMap[item] || item
    }
    return item
  })
}

async function decoratePost(item) {
  const data = normalizeCloudPost(item)
  const mappedImages = await mapCloudFileIDs(data.images)
  return {
    ...data,
    images: mappedImages,
    createdAtText: formatCreatedAt(data.createdAt),
    updatedAtText: formatCreatedAt(data.updatedAt)
  }
}

function runAutoAudit(data) {
  const hit = hitRiskyWord([data.title, data.itemName, data.location, data.contact, data.description])
  if (hit) {
    return {
      auditStatus: 'rejected',
      auditRemark: `命中敏感词：${hit}`
    }
  }

  if (safeTrim(data.title).length < 3) {
    return {
      auditStatus: 'rejected',
      auditRemark: '标题信息过短，请补充更明确的物品描述。'
    }
  }

  return {
    auditStatus: 'approved',
    auditRemark: '审核通过，信息已进入展示列表。'
  }
}

function canDisplayPost(item) {
  const auditStatus = item && item.auditStatus
  const status = item && item.status
  return (!auditStatus || auditStatus === 'approved') && status !== 'reviewing'
}

async function getOpenId() {
  const res = await wx.cloud.callFunction({ name: 'login' })
  return res.result && res.result.openid
}

async function checkAdminStatus() {
  const res = await wx.cloud.callFunction({ name: 'checkAdmin' })
  return res.result || { openid: '', isAdmin: false, count: 0, records: [] }
}

async function isAdmin(openid) {
  if (!openid) return false
  try {
    const result = await checkAdminStatus()
    return !!result.isAdmin
  } catch (error) {
    console.error('管理员白名单校验失败：', error)
    return false
  }
}

async function getUserProfileCloud() {
  const openid = await getOpenId()
  const res = await users.where({ userId: openid }).get()
  if (res.data && res.data.length) {
    return res.data[0]
  }
  return null
}

async function saveUserProfileCloud(profile) {
  const openid = await getOpenId()
  const old = await getUserProfileCloud()
  const data = {
    userId: openid,
    nickName: profile.nickName || '微信用户',
    avatarUrl: profile.avatarUrl || '',
    updatedAt: Date.now()
  }

  if (old && old._id) {
    await users.doc(old._id).update({ data })
    return { ...old, ...data }
  }

  await users.add({
    data: {
      ...data,
      createdAt: Date.now()
    }
  })
  return data
}

async function uploadImages(paths = []) {
  const uploads = paths.map((filePath, index) => {
    if (!filePath || String(filePath).indexOf('cloud://') === 0) {
      return Promise.resolve(filePath)
    }
    const ext = filePath.split('.').pop() || 'jpg'
    const cloudPath = `posts/${Date.now()}_${index}.${ext}`
    return wx.cloud.uploadFile({
      cloudPath,
      filePath
    }).then(res => res.fileID)
  })
  return Promise.all(uploads)
}

async function createPostCloud(data) {
  const imageFileIDs = await uploadImages(data.images || [])
  const audit = runAutoAudit(data)
  const profile = await getUserProfileCloud()
  const now = Date.now()
  const isApproved = audit.auditStatus === 'approved'
  const nextStatus = isApproved ? 'published' : 'reviewing'

  const result = await posts.add({
    data: {
      title: safeTrim(data.title),
      itemName: safeTrim(data.itemName),
      type: data.type,
      category: data.category,
      images: imageFileIDs,
      location: safeTrim(data.location),
      time: safeTrim(data.time),
      contact: safeTrim(data.contact),
      description: safeTrim(data.description),
      status: nextStatus,
      auditStatus: audit.auditStatus,
      auditRemark: audit.auditRemark,
      userName: (profile && profile.nickName) || '微信用户',
      avatarUrl: (profile && profile.avatarUrl) || '',
      createdAt: now,
      updatedAt: now,
      auditAt: now,
      publishedAt: isApproved ? now : 0,
      resolvedAt: 0,
      closedAt: 0
    }
  })
  return result
}

async function fetchPostsCloud() {
  try {
    const res = await posts.orderBy('createdAt', 'desc').get()
    const list = (res.data || []).filter(canDisplayPost)
    return Promise.all(list.map(decoratePost))
  } catch (error) {
    console.error('云端列表读取失败，降级为空列表：', error)
    return []
  }
}

async function fetchAllPostsCloud() {
  const res = await posts.orderBy('createdAt', 'desc').get()
  return Promise.all((res.data || []).map(decoratePost))
}

async function fetchPostDetailCloud(id) {
  const res = await posts.doc(id).get()
  return decoratePost(res.data)
}

async function fetchMyPostsCloud() {
  const openid = await getOpenId()
  const res = await posts.where({ _openid: openid }).orderBy('createdAt', 'desc').get()
  return Promise.all((res.data || []).map(decoratePost))
}

async function updatePostStatusCloud(id, status) {
  const openid = await getOpenId()
  const admin = await isAdmin(openid)
  const detail = await posts.doc(id).get()
  const item = detail && detail.data ? detail.data : {}
  const ownerId = item._openid || item.userId || ''

  if (!admin && ownerId !== openid) {
    throw new Error('无状态修改权限')
  }

  const now = Date.now()
  const data = {
    status,
    updatedAt: now
  }

  if (status === 'resolved') {
    data.resolvedAt = now
    data.closedAt = 0
  }
  if (status === 'closed') {
    data.closedAt = now
  }
  if (status === 'published') {
    data.publishedAt = now
    data.closedAt = 0
  }

  return posts.doc(id).update({ data })
}

async function updateAuditStatusCloud(id, auditStatus, auditRemark) {
  const openid = await getOpenId()
  const admin = await isAdmin(openid)

  if (!admin) {
    throw new Error('无管理员审核权限')
  }

  return wx.cloud.callFunction({
    name: 'adminPostAction',
    data: {
      action: 'updateAuditStatus',
      id,
      auditStatus,
      auditRemark
    }
  })
}

async function deleteCloudImages(fileIDs = []) {
  const valid = []
  for (let i = 0; i < fileIDs.length; i += 1) {
    const id = fileIDs[i]
    if (typeof id === 'string' && id.indexOf('cloud://') === 0) {
      valid.push(id)
    }
  }
  if (!valid.length) return
  return wx.cloud.deleteFile({ fileList: valid })
}

async function deletePostCloud(id) {
  const res = await posts.doc(id).get()
  const raw = res.data || {}
  const openid = await getOpenId()
  const ownerId = raw._openid || raw.userId || ''
  const admin = await isAdmin(openid)

  if (admin && ownerId !== openid) {
    return wx.cloud.callFunction({
      name: 'adminPostAction',
      data: {
        action: 'deletePost',
        id
      }
    })
  }

  if (ownerId !== openid) {
    throw new Error('无删除权限')
  }

  await deleteCloudImages(raw.images || [])
  return posts.doc(id).remove()
}

module.exports = {
  db,
  _,
  posts,
  users,
  admins,
  getOpenId,
  isAdmin,
  checkAdminStatus,
  getUserProfileCloud,
  saveUserProfileCloud,
  uploadImages,
  createPostCloud,
  fetchPostsCloud,
  fetchAllPostsCloud,
  fetchPostDetailCloud,
  fetchMyPostsCloud,
  updatePostStatusCloud,
  updateAuditStatusCloud,
  deletePostCloud,
  deleteCloudImages,
  formatCreatedAt,
  decoratePost,
  runAutoAudit,
  mapCloudFileIDs,
  canDisplayPost
}
