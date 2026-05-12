const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const posts = db.collection('posts')

function inferStatus(item) {
  if (item.status) {
    if (item.status === 'pending') {
      return item.auditStatus === 'approved' ? 'published' : 'reviewing'
    }
    return item.status
  }

  if (item.auditStatus === 'approved' || !item.auditStatus) {
    return 'published'
  }
  return 'reviewing'
}

function buildPatch(item) {
  const data = {}
  const now = Date.now()
  const auditStatus = !item.auditStatus || item.auditStatus === 'reviewing'
    ? 'approved'
    : item.auditStatus
  const nextStatus = inferStatus({ ...item, auditStatus })

  if (!item.auditStatus || item.auditStatus === 'reviewing') data.auditStatus = auditStatus
  if (!item.auditRemark) {
    data.auditRemark = auditStatus === 'approved' ? '历史数据补齐，默认审核通过。' : '历史数据补齐，请根据页面提示完善信息。'
  }
  if (!item.status || item.status === 'pending') {
    data.status = nextStatus
  }
  if (!Array.isArray(item.images)) data.images = []
  if (!item.userName) data.userName = '微信用户'
  if (!item.updatedAt) data.updatedAt = item.createdAt || now
  if (!item.auditAt) data.auditAt = item.updatedAt || item.createdAt || now
  if (nextStatus === 'published' && !item.publishedAt) {
    data.publishedAt = item.updatedAt || item.createdAt || now
  }
  if (nextStatus !== 'published' && item.publishedAt) {
    data.publishedAt = 0
  }
  if (nextStatus !== 'resolved' && !item.resolvedAt) {
    data.resolvedAt = 0
  }
  if (nextStatus !== 'closed' && !item.closedAt) {
    data.closedAt = 0
  }

  return data
}

exports.main = async () => {
  const res = await posts.get()
  const list = res.data || []
  const tasks = []

  for (let i = 0; i < list.length; i += 1) {
    const item = list[i]
    const data = buildPatch(item)

    if (Object.keys(data).length) {
      tasks.push(posts.doc(item._id).update({ data }))
    }
  }

  if (tasks.length) {
    await Promise.all(tasks)
  }

  return {
    total: list.length,
    fixed: tasks.length,
    message: 'posts 历史数据修复完成'
  }
}
