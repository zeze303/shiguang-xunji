const theme = require('./theme')

function updateTabBar(ctx, index) {
  if (typeof ctx.getTabBar !== 'function') return

  const tabBar = ctx.getTabBar()
  if (!tabBar || typeof tabBar.setData !== 'function') return

  const updates = {}

  if (!tabBar.data || tabBar.data.selected !== index) {
    updates.selected = index
  }

  const dark = theme.getEffectiveTheme() === 'dark'
  const themeClass = dark ? 'theme-dark' : 'theme-light'
  if (!tabBar.data || tabBar.data.themeClass !== themeClass) {
    updates.themeClass = themeClass
  }

  if (Object.keys(updates).length) {
    tabBar.setData(updates)
  }

  if (typeof tabBar.syncSelectedByRoute === 'function') {
    setTimeout(() => {
      tabBar.syncSelectedByRoute()
    }, 0)
  }
}

module.exports = {
  updateTabBar
}
