const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const posts = db.collection('posts')
const admins = db.collection('admins')

function buildAuditRemark(auditStatus, auditRemark) {
  if (auditRemark && String(auditRemark).trim()) {
    return String(auditRemark).trim()
  }
  return auditStatus === 'approved' ? '管理员审核通过，信息可正常展示。' : '管理员审核未通过，请补充关键信息后重新提交。'
}

function buildUpdateData(auditStatus, auditRemark) {
  const now = Date.now()
  const data = {
    auditStatus,
    auditRemark,
    updatedAt: now,
    auditAt: now
  }

  if (auditStatus === 'approved') {
    data.status = 'published'
    data.publishedAt = now
  }

  if (auditStatus === 'rejected') {
    data.status = 'reviewing'
    data.publishedAt = 0
    data.resolvedAt = 0
    data.closedAt = 0
  }

  return data
}

function pickCloudImages(images) {
  if (!Array.isArray(images)) {
    return []
  }
  return images.filter(item => typeof item === 'string' && item.indexOf('cloud://') === 0)
}

async function ensureAdmin() {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const adminRes = await admins.where({ openid }).get()
  const isAdmin = !!(adminRes.data && adminRes.data.length)

  if (!isAdmin) {
    throw new Error('无管理员权限')
  }
}

async function handleUpdateAuditStatus(event) {
  const id = event && event.id
  const auditStatus = event && event.auditStatus
  const auditRemark = buildAuditRemark(auditStatus, event && event.auditRemark)

  if (!id) {
    throw new Error('缺少帖子 id')
  }
  if (!auditStatus || !['approved', 'rejected'].includes(auditStatus)) {
    throw new Error('审核状态无效')
  }

  await posts.doc(id).update({
    data: buildUpdateData(auditStatus, auditRemark)
  })

  return {
    success: true,
    id,
    auditStatus,
    auditRemark
  }
}

async function handleDeletePost(event) {
  const id = event && event.id
  if (!id) {
    throw new Error('缺少帖子 id')
  }

  let post
  try {
    const postRes = await posts.doc(id).get()
    post = postRes.data
  } catch (error) {
    if (error && error.errCode === -1) {
      return {
        success: true,
        deletedId: id,
        deletedImages: 0,
        alreadyRemoved: true
      }
    }
    throw error
  }

  const images = pickCloudImages(post && post.images)
  if (images.length) {
    try {
      await cloud.deleteFile({ fileList: images })
    } catch (error) {
      console.error('删除云存储图片失败：', error)
    }
  }

  await posts.doc(id).remove()

  return {
    success: true,
    deletedId: id,
    deletedImages: images.length
  }
}

exports.main = async event => {
  const action = event && event.action

  await ensureAdmin()

  if (action === 'deletePost') {
    return handleDeletePost(event)
  }

  return handleUpdateAuditStatus(event)
}
