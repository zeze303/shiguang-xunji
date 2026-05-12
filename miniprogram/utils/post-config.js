const POST_TYPES = {
  found: '招领',
  lost: '寻物'
}

const POST_STATUS = {
  pending: '审核中',
  reviewing: '审核中',
  published: '展示中',
  resolved: '已完成',
  closed: '已关闭'
}

const AUDIT_STATUS = {
  approved: '审核通过',
  rejected: '审核未通过',
  pending: '审核中'
}

const CATEGORY_OPTIONS = ['证件', '钥匙', '书本', '电子产品', '其他']
const CATEGORY_WITH_ALL = ['全部'].concat(CATEGORY_OPTIONS)
const CONTACT_TYPE_OPTIONS = ['微信', 'QQ', '电话', '其他']

const SEARCH_FIELDS = ['title', 'itemName', 'location', 'description', 'contact']
const QUICK_FILTERS = [
  { key: 'all', label: '全部状态' },
  { key: 'reviewing', label: '审核中' },
  { key: 'published', label: '展示中' },
  { key: 'resolved', label: '已完成' },
  { key: 'closed', label: '已关闭' }
]

const RISKY_WORDS = ['代购彩票', '刷单', '兼职', '加群', '贷款', '色情', '赌博', '出售答案']
const STORAGE_KEYS = {
  draft: 'sgxw_publish_draft',
  draftMeta: 'sgxw_publish_draft_meta'
}

const ERROR_CODES = {
  NETWORK_BUSY: 'NETWORK_BUSY',
  DRAFT_SAVE_FAILED: 'DRAFT_SAVE_FAILED',
  DRAFT_LOAD_FAILED: 'DRAFT_LOAD_FAILED',
  DETAIL_LOAD_FAILED: 'DETAIL_LOAD_FAILED',
  STATUS_UPDATE_FAILED: 'STATUS_UPDATE_FAILED',
  DELETE_POST_FAILED: 'DELETE_POST_FAILED',
  COPY_CONTACT_FAILED: 'COPY_CONTACT_FAILED',
  INVALID_CONTACT: 'INVALID_CONTACT',
  SUBMIT_BLOCKED: 'SUBMIT_BLOCKED'
}

const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_BUSY]: '网络异常，请稍后重试',
  [ERROR_CODES.DRAFT_SAVE_FAILED]: '草稿保存失败',
  [ERROR_CODES.DRAFT_LOAD_FAILED]: '草稿读取失败',
  [ERROR_CODES.DETAIL_LOAD_FAILED]: '详情加载失败',
  [ERROR_CODES.STATUS_UPDATE_FAILED]: '状态更新失败',
  [ERROR_CODES.DELETE_POST_FAILED]: '删除失败',
  [ERROR_CODES.COPY_CONTACT_FAILED]: '复制失败',
  [ERROR_CODES.INVALID_CONTACT]: '联系方式格式不正确，请检查后重新填写',
  [ERROR_CODES.SUBMIT_BLOCKED]: '当前内容无法提交，请调整后重试'
}

const STATUS_META = {
  pending: {
    label: '审核中',
    tone: 'warning',
    desc: '记录仍在审核中。'
  },
  reviewing: {
    label: '审核中',
    tone: 'warning',
    desc: '信息已提交，待审核。'
  },
  published: {
    label: '展示中',
    tone: 'success',
    desc: '信息正在展示。'
  },
  resolved: {
    label: '已完成',
    tone: 'success',
    desc: '该信息已完成。'
  },
  closed: {
    label: '已关闭',
    tone: 'default',
    desc: '该信息已关闭。'
  }
}

const AUDIT_META = {
  approved: {
    label: '审核通过',
    tone: 'success',
    desc: '内容已通过审核。'
  },
  rejected: {
    label: '审核未通过',
    tone: 'danger',
    desc: '内容未通过审核。'
  },
  pending: {
    label: '审核中',
    tone: 'warning',
    desc: '信息已提交，待审核。'
  }
}

const STATUS_FLOW_META = {
  pending: [
    { key: 'created', label: '已提交', done: true },
    { key: 'audit', label: '处理中', done: true },
    { key: 'published', label: '待展示', done: false },
    { key: 'resolved', label: '已完成', done: false }
  ],
  reviewing: [
    { key: 'created', label: '已提交', done: true },
    { key: 'audit', label: '审核中', done: true },
    { key: 'published', label: '待展示', done: false },
    { key: 'resolved', label: '已完成', done: false }
  ],
  published: [
    { key: 'created', label: '已提交', done: true },
    { key: 'audit', label: '审核通过', done: true },
    { key: 'published', label: '展示中', done: true },
    { key: 'resolved', label: '已完成', done: false }
  ],
  resolved: [
    { key: 'created', label: '已提交', done: true },
    { key: 'audit', label: '审核通过', done: true },
    { key: 'published', label: '展示完成', done: true },
    { key: 'resolved', label: '已完成', done: true }
  ],
  closed: [
    { key: 'created', label: '已提交', done: true },
    { key: 'audit', label: '审核结束', done: true },
    { key: 'published', label: '已关闭', done: true },
    { key: 'resolved', label: '流程结束', done: true }
  ],
  rejected: [
    { key: 'created', label: '已提交', done: true },
    { key: 'audit', label: '审核未通过', done: true },
    { key: 'published', label: '未展示', done: false },
    { key: 'resolved', label: '待修改', done: false }
  ]
}

const CONTACT_RULES = {
  微信: {
    min: 2,
    max: 30,
    pattern: /^[A-Za-z][A-Za-z0-9_-]{1,29}$/,
    tip: '请输入 2-30 位微信号，需以字母开头'
  },
  QQ: {
    min: 5,
    max: 12,
    pattern: /^[1-9][0-9]{4,11}$/,
    tip: '请输入正确的 QQ 号码'
  },
  电话: {
    min: 7,
    max: 20,
    pattern: /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/,
    tip: '请输入正确的手机号或座机号'
  },
  其他: {
    min: 2,
    max: 30,
    pattern: /^.{2,30}$/,
    tip: '请填写 2-30 个字符的联系方式'
  }
}

function getPostTypeLabel(type) {
  return POST_TYPES[type] || POST_TYPES.found
}

function getPostStatusLabel(status, auditStatus) {
  const normalizedStatus = normalizeStatus(status, auditStatus)
  return POST_STATUS[normalizedStatus] || POST_STATUS.pending
}

function getAuditStatusLabel(status) {
  return AUDIT_STATUS[status] || AUDIT_STATUS.pending
}

function getErrorMessage(code, fallback = '') {
  return ERROR_MESSAGES[code] || fallback || '操作失败，请稍后重试'
}

function normalizeStatus(status, auditStatus) {
  if (status === 'pending') {
    return auditStatus === 'approved' ? 'published' : 'reviewing'
  }
  if (!status) {
    return auditStatus === 'approved' ? 'published' : 'reviewing'
  }
  return status
}

function getStatusMeta(status, auditStatus) {
  const normalizedStatus = normalizeStatus(status, auditStatus)
  return STATUS_META[normalizedStatus] || STATUS_META.pending
}

function getAuditMeta(status) {
  const auditStatus = status === 'reviewing' ? 'pending' : status
  return AUDIT_META[auditStatus] || AUDIT_META.pending
}

function getStatusFlow(status, auditStatus) {
  const normalizedStatus = normalizeStatus(status, auditStatus)
  if (auditStatus === 'rejected') {
    return STATUS_FLOW_META.rejected
  }
  return STATUS_FLOW_META[normalizedStatus] || STATUS_FLOW_META.pending
}

function getAuditReasonText(detail = {}) {
  if (safeTrim(detail.auditRemark)) {
    return safeTrim(detail.auditRemark)
  }
  const auditMeta = getAuditMeta(detail.auditStatus)
  return auditMeta.desc
}

function safeTrim(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeKeyword(value) {
  return safeTrim(value).toLowerCase()
}

function hitRiskyWord(values = []) {
  const text = values
    .map(item => normalizeKeyword(item))
    .filter(Boolean)
    .join(' ')

  for (let i = 0; i < RISKY_WORDS.length; i += 1) {
    if (text.indexOf(RISKY_WORDS[i]) > -1) {
      return RISKY_WORDS[i]
    }
  }
  return ''
}

function matchPostKeyword(post, keyword) {
  const text = normalizeKeyword(keyword)
  if (!text) return true
  for (let i = 0; i < SEARCH_FIELDS.length; i += 1) {
    const field = SEARCH_FIELDS[i]
    if (normalizeKeyword(post[field]).indexOf(text) > -1) {
      return true
    }
  }
  return false
}

function buildContactText(type, value) {
  return `${type}：${safeTrim(value)}`
}

function getContactRule(type) {
  return CONTACT_RULES[type] || CONTACT_RULES.其他
}

module.exports = {
  POST_TYPES,
  POST_STATUS,
  AUDIT_STATUS,
  CATEGORY_OPTIONS,
  CATEGORY_WITH_ALL,
  CONTACT_TYPE_OPTIONS,
  QUICK_FILTERS,
  SEARCH_FIELDS,
  RISKY_WORDS,
  STORAGE_KEYS,
  ERROR_CODES,
  ERROR_MESSAGES,
  STATUS_META,
  AUDIT_META,
  STATUS_FLOW_META,
  CONTACT_RULES,
  getPostTypeLabel,
  getPostStatusLabel,
  getAuditStatusLabel,
  getErrorMessage,
  normalizeStatus,
  getStatusMeta,
  getAuditMeta,
  getStatusFlow,
  getAuditReasonText,
  safeTrim,
  normalizeKeyword,
  hitRiskyWord,
  matchPostKeyword,
  buildContactText,
  getContactRule
}
