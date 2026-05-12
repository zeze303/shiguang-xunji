const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const admins = db.collection('admins')

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const res = await admins.where({ openid }).get()
  return {
    openid,
    isAdmin: !!(res.data && res.data.length),
    count: res.data ? res.data.length : 0,
    records: res.data || []
  }
}
