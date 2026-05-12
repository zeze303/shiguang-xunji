const theme = require('../utils/theme')

Component({
  data: {
    themeClass: 'theme-light',
    selected: 0,
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: '/images/icon-home.svg' },
      { pagePath: '/pages/list/list', text: '列表', icon: '/images/icon-list.svg' },
      { pagePath: '/pages/publish/publish', text: '登记', icon: '/images/icon-publish.svg' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: '/images/icon-mine.svg' }
    ]
  },

  lifetimes: {
    attached() {
      this.syncSelectedByRoute()
      this.applyTheme()
    }
  },

  pageLifetimes: {
    show() {
      this.syncSelectedByRoute()
      this.applyTheme()
    }
  },

  methods: {
    applyTheme() {
      const dark = theme.getEffectiveTheme() === 'dark'
      this.setData({
        themeClass: dark ? 'theme-dark' : 'theme-light'
      })
    },

    syncSelectedByRoute() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const route = current && current.route ? `/${current.route}` : ''
      const index = this.data.list.findIndex(item => item.pagePath === route)
      if (index > -1 && index !== this.data.selected) {
        this.setData({ selected: index })
      }
    },

    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const currentRoute = current && current.route ? `/${current.route}` : ''

      if (currentRoute === path) {
        const scrollTop = Number((current && current.data && current.data.pageScrollTop) || 0)

        if (scrollTop > 20) {
          wx.pageScrollTo({
            scrollTop: 0,
            duration: 250
          })
          return
        }

        if (current && typeof current.onTabRepeat === 'function') {
          current.onTabRepeat()
        } else if (current && typeof current.onPullDownRefresh === 'function') {
          current.onPullDownRefresh()
        } else if (current && typeof current.onShow === 'function') {
          current.onShow()
        }
        return
      }

      this.setData({ selected: index })
      wx.switchTab({
        url: path,
        complete: () => {
          setTimeout(() => {
            this.syncSelectedByRoute()
          }, 0)
        }
      })
    }
  }
})
