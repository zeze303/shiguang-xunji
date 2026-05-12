const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async event => {
  const fileList = Array.isArray(event && event.fileList) ? event.fileList : []
  if (!fileList.length) {
    return {
      fileList: []
    }
  }

  return cloud.getTempFileURL({ fileList })
}
