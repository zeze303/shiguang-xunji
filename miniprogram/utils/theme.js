const STORAGE_KEY = 'sgxw-theme-mode'
const MODES = ['light', 'dark']

const LABELS = {
  light: '浅色',
  dark: '深色'
}

function getPreference() {
  const v = wx.getStorageSync(STORAGE_KEY)
  if (v === 'system' || !v) {
    return getSystemTheme()
  }
  return MODES.indexOf(v) >= 0 ? v : getSystemTheme()
}

function setPreference(mode) {
  if (MODES.indexOf(mode) < 0) return
  wx.setStorageSync(STORAGE_KEY, mode)
}

function cyclePreference() {
  const i = MODES.indexOf(getPreference())
  const nextIndex = i >= 0 ? (i + 1) % MODES.length : 0
  setPreference(MODES[nextIndex])
}

function getSystemTheme() {
  try {
    const info = wx.getSystemInfoSync()
    return info.theme === 'dark' ? 'dark' : 'light'
  } catch (e) {
    return 'light'
  }
}

/** 实际用于样式与导航栏：仅保留浅色 / 深色两态，首次进入参考系统主题 */
function getEffectiveTheme() {
  const pref = getPreference()
  if (pref === 'light') return 'light'
  if (pref === 'dark') return 'dark'
  return getSystemTheme()
}

function getPreferenceLabel() {
  return LABELS[getPreference()]
}

function applyPageTheme(page) {
  if (!page || typeof page.setData !== 'function') return
  const dark = getEffectiveTheme() === 'dark'
  page.setData({
    themeClass: dark ? 'theme-dark' : 'theme-light'
  })
  wx.setNavigationBarColor({
    frontColor: dark ? '#ffffff' : '#000000',
    backgroundColor: dark ? '#020617' : '#e4eaf4',
    animation: false
  })
  wx.setBackgroundColor({
    backgroundColor: dark ? '#030712' : '#e4eaf4'
  })
}

function syncTabBarTheme() {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (!cur || typeof cur.getTabBar !== 'function') return
  const tb = cur.getTabBar()
  if (tb && typeof tb.applyTheme === 'function') tb.applyTheme()
}

function refreshAfterPreferenceChange() {
  const pages = getCurrentPages()
  pages.forEach((p) => applyPageTheme(p))
  syncTabBarTheme()
  const cur = pages[pages.length - 1]
  if (cur && typeof cur.syncThemeToggleLabel === 'function') {
    cur.syncThemeToggleLabel()
  }
}

function onAppThemeChange() {
  const stored = wx.getStorageSync(STORAGE_KEY)
  if (stored && stored !== 'system') return
  refreshAfterPreferenceChange()
}

module.exports = {
  getPreference,
  setPreference,
  cyclePreference,
  getPreferenceLabel,
  getEffectiveTheme,
  applyPageTheme,
  refreshAfterPreferenceChange,
  onAppThemeChange
}
