# 拾光循迹 UI 优化修改表

基于设计审查 /audit 结果，按优先级排列。P0 为低成本高收益项，P1 为功能增强，P2 为体验打磨。

---

## 一、全局变量与主题系统

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| G01 | P0 | `theme-tokens.wxss` | 缺少成套的语义色变量（状态色、操作色） | 新增 `--color-success` / `--color-warning` / `--color-error` / `--color-info` 四套含 light/hover/active 变体，`--radius-xs` / `--radius-xl` 补齐圆角体系 | `styles/theme-tokens.wxss` | 20min |
| G02 | P0 | `theme-tokens.wxss` | 间距变量只有 `--spacing-sm/md/lg` 三档，层级感不足 | 扩展为五档：`--spacing-xs(4)` / `--spacing-sm(8)` / `--spacing-md(16)` / `--spacing-lg(24)` / `--spacing-xl(32)`，卡片内 padding 统一引用 | `styles/theme-tokens.wxss` | 10min |
| G03 | P0 | `theme-tokens.wxss` | 毛玻璃效果仅靠 backdrop-filter，缺乏 fallback | 为暗色模式增加 `background: rgba` 降级底色，确保不支持 backdrop-filter 的机型有底 | `styles/theme-tokens.wxss` | 10min |
| G04 | P1 | `app.wxss` | 全局字号缺少层级变量定义 | 抽 `--font-xs(12)` / `--font-sm(13)` / `--font-md(15)` / `--font-lg(17)` / `--font-xl(20)` 到 theme-tokens，各页面统一引用 | `styles/theme-tokens.wxss` + `app.wxss` | 15min |
| G05 | P2 | `app.wxss` | 过渡动效仅 fade-in，类型单一 | 新增 slide-up / slide-down / scale-in 三组关键帧，页面路由和列表出现时按场景使用 | `app.wxss` | 15min |

---

## 二、首页（home）

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| H01 | **P0** | hero 区域 | 失物/招领两张 hero 卡片完全对称重复，视觉疲劳 | 保留一张集成式 hero，左侧用 SVG 图标 + 统计数字，右侧放快捷发布入口。去掉完全对称的双卡布局 | `pages/home/home.wxml` `pages/home/home.wxss` `pages/home/home.js` | 30min |
| H02 | P0 | 快捷分类区 | 分类按钮纯文字，缺少图标辅助识别 | 每个分类新增一个 32×32 SVG 图标（证件/电子产品/书籍/钥匙/生活用品/其他），图标置于文字上方 | `pages/home/home.wxml` `pages/home/home.wxss` + 新建 SVG × 6 | 30min |
| H03 | P1 | 功能区 | "我的登记""管理入口"按钮样式与普通卡片无区分 | 为操作型卡片增加 **强调变体**（`--variant-accent`）：左侧加色带条，图标改用描边加粗到 3.5 | `pages/home/home.wxml` `pages/home/home.wxss` | 15min |
| H04 | P2 | 整体 | 页面信息密度偏低，大面积留白但缺乏层次 | 增加页面顶部标题栏（"拾光循迹" + 副标题），功能区卡片按行分组 + 卡片间 `--spacing-md` 改为 `--spacing-lg` | `pages/home/home.wxml` `pages/home/home.wxss` | 15min |

---

## 三、列表页（list）

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| L01 | **P0** | 筛选栏 | 分类/状态/类型三个筛选切换样式均为纯色按钮，无区分度 | 类型筛选（招领/寻物）用**强调色填充按钮**，分类用**轮廓按钮**，状态用**文字标签**，三级视觉权重自然拉开 | `pages/list/list.wxml` `pages/list/list.wxss` | 20min |
| L02 | P0 | 卡片 | 卡片内标题 + 描述 + 状态的排版缺少图标辅助 | 每张卡片左侧增加 40×40 **物品类型SVG图标**（沿用分类图标体系），替代当前纯文字标签 | `pages/list/list.wxml` `pages/list/list.wxss` | 20min |
| L03 | P1 | 卡片 | "认领""详情"按钮样式相同，操作意图不明确 | 详情按钮用**轮廓按钮**，认领/联系用**强调色填充按钮**，视觉上一眼分清"查看"和"操作" | `pages/list/list.wxml` `pages/list/list.wxss` | 15min |
| L04 | P2 | 空状态 | 空数据页仅文字提示，缺乏视觉引导 | 使用 `icon-empty-placeholder.svg` 居中展示，下方配提示文字 + "去发布"按钮 | `pages/list/list.wxml` `pages/list/list.wxss` | 10min |

---

## 四、发布页（publish）

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| P01 | P1 | 表单 | 表单输入框无聚焦状态视觉效果 | 为 input/textarea 增加 focus 态：边框色变为主强调色，左侧加 3px 色条 | `pages/publish/publish.wxml` `pages/publish/publish.wxss` | 15min |
| P02 | P1 | 分类选择 | 分类选择器是 picker，无分类对应的图标 | picker 选项名左侧配迷你 SVG 图标（沿用分类图标 × 6），选中后图标 + 文字一起显示 | `pages/publish/publish.wxml` `pages/publish/publish.wxss` `pages/publish/publish.js` | 20min |
| P03 | P2 | 图片上传 | 上传区域仅+号，缺少预览缩略图和删除按钮 | 上传后显示缩略图卡片，右上角圆角删除按钮，拖拽排序 | `pages/publish/publish.wxml` `pages/publish/publish.wxss` `pages/publish/publish.js` | 25min |
| P04 | P2 | 提交按钮 | "提交"按钮无 loading 和成功/失败反馈 | 提交时按钮显示 loading 动画，成功后按钮变为"已提交"（绿色不可点击），失败保持原样显示错误 toast | `pages/publish/publish.wxml` `pages/publish/publish.wxss` `pages/publish/publish.js` | 20min |

---

## 五、详情页（detail）

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| D01 | **P0** | 信息区 | 物品信息为纯文字列表，无辅助图标，阅读效率低 | 每行增加 SVG 图标：类别（📦图标）、地点（📍图标）、时间（🕐图标）、联系人（👤图标）、联系方式（📞图标） | `pages/detail/detail.wxml` `pages/detail/detail.wxss` | 20min |
| D02 | P1 | 状态标签 | 仅文字+背景色标识状态，无状态图标 | 在状态文字左侧加 SVG 状态图标（`icon-status-pending` / `icon-status-resolved`），审核状态增加 `icon-audit-approved` | `pages/detail/detail.wxml` `pages/detail/detail.wxss` | 10min |
| D03 | P1 | 操作栏 | 底部操作按钮在内容少时固定定位遮挡内容 | 操作栏改为粘性定位（sticky），仅在内容超出视口时吸底；同时减少按钮圆角到 `--radius-md` 增加硬朗感 | `pages/detail/detail.wxml` `pages/detail/detail.wxss` | 15min |
| D04 | P2 | 图片区 | 单图展示区域较小，无法查看大图 | 增加点击预览放大功能（微信 `wx.previewImage`），图片区域增加"点击查看大图"提示文字 | `pages/detail/detail.wxml` `pages/detail/detail.js` | 10min |

---

## 六、我的（mine）

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| M01 | P1 | 用户头像 | 头像占位区偏小，缺少编辑入口 | 头像放大到 72×72，右下角加编辑图标（小铅笔SVG），点击触发头像编辑 | `pages/mine/mine.wxml` `pages/mine/mine.wxss` | 15min |
| M02 | P1 | 数据统计 | "已发布""审核中""已完成"仅数字显示，无卡片承载 | 三个数据改为三张小统计卡片并排，每张卡片顶部加对应SVG图标，数字字体加粗加大 | `pages/mine/mine.wxml` `pages/mine/mine.wxss` | 20min |
| M03 | P2 | 菜单项 | 菜单列表纯文字项，无图标区分 | 每项菜单左侧加 SVG 图标（我的登记/管理入口/关于/设置），右侧箭头统一风格 | `pages/mine/mine.wxml` `pages/mine/mine.wxss` | 15min |

---

## 七、管理页（admin）

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| A01 | **P0** | 审核卡片 | 每条记录为纯文字卡片，缺少待审核/已通过/已拒绝的视觉区分 | 用**语义化颜色**区分审核状态：待审核应用 `--color-warning`（橙），已通过用 `--color-success`（绿），已拒绝用 `--color-error`（红），状态标签用对应色阶 | `pages/admin/admin.wxml` `pages/admin/admin.wxss` | 25min |
| A02 | P0 | 操作按钮 | "通过""拒绝"按钮颜色相同，操作意图不清晰 | "通过"用绿色填充按钮，"拒绝"用红色轮廓按钮，审核完成按钮置灰不可重复操作 | `pages/admin/admin.wxml` `pages/admin/admin.wxss` | 15min |
| A03 | P1 | 审核项 | 审核列表缺少物品缩略图 | 每条左侧加 48×48 物品缩略图圆角裁剪，无图时显示默认 SVG 占位 | `pages/admin/admin.wxml` `pages/admin/admin.wxss` | 20min |

---

## 八、我的登记页（my-posts）

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| MP01 | P1 | 列表卡片 | 卡片排版与 list 页雷同，无区分 | 每张卡片顶部增加状态色条（绿=已完成/橙=审核中/灰=已拒绝），与 list 页纯白卡片拉开差异 | `pages/my-posts/my-posts.wxml` `pages/my-posts/my-posts.wxss` | 15min |
| MP02 | P1 | 状态筛选 | 顶部"全部/审核中/已完成/已拒绝" tabs 无视觉区分 | 当前选中的 tab 下方加 3px 强调色下划线 + 字号加粗，未选中的为灰色文字 | `pages/my-posts/my-posts.wxml` `pages/my-posts/my-posts.wxss` | 10min |

---

## 九、自定义 TabBar

| ID | 层级 | 位置 | 当前问题 | 修改方案 | 涉及文件 | 工时 |
|---|---|---|---|---|---|---|
| T01 | P1 | Tab 项 | 选中态仅图标颜色变化，缺少过渡动效 | 选中态增加：图标渐变透明度过渡 0.3s + 选中项底部浮现 2px 圆点指示器 | `custom-tab-bar/index.wxml` `custom-tab-bar/index.wxss` | 20min |
| T02 | P2 | 发布按钮 | 中间发布按钮尺寸与其他 tab 一致，不够突出 | 发布按钮放大到 56×56，略微上浮 8px，加微弱的发光阴影 | `custom-tab-bar/index.wxml` `custom-tab-bar/index.wxss` | 10min |

---

## 十、SVG 图标新增清单

所有 SVG 沿用现有规范：viewBox="0 0 64 64"、描边 2.5、线帽 round、渐变色 `#35E2FF → #5B7CFF`。

| ID | 图标名称 | 用途 | 文件命名 |
|---|---|---|---|
| IC01 | 证件 | 分类图标（首页/发布/列表） | `icon-cat-id.svg` |
| IC02 | 电子产品 | 分类图标 | `icon-cat-electronics.svg` |
| IC03 | 书籍 | 分类图标 | `icon-cat-book.svg` |
| IC04 | 钥匙 | 分类图标 | `icon-cat-key.svg` |
| IC05 | 生活用品 | 分类图标 | `icon-cat-daily.svg` |
| IC06 | 其他 | 分类图标 | `icon-cat-other.svg` |
| IC07 | 地点 | 详情行图标 + 卡片位置标识 | `icon-location.svg` |
| IC08 | 时间 | 详情行图标 | `icon-time.svg` |
| IC09 | 联系人 | 详情行图标 | `icon-contact.svg` |
| IC10 | 联系方式 | 详情行图标（电话） | `icon-phone.svg` |
| IC11 | 铅笔编辑 | 头像编辑按钮 | `icon-edit.svg` |
| IC12 | 箭头右 | 菜单项指示箭头 | `icon-arrow-right.svg` |
| IC13 | 设置 | 我的页面菜单 | `icon-settings.svg` |
| IC14 | 关于 | 我的页面菜单 | `icon-about.svg` |
| IC15 | 反馈 | 我的页面菜单 | `icon-feedback.svg` |
| IC16 | 搜索 | 列表页搜索框 | `icon-search.svg` |
| IC17 | 关闭 | 标签/弹窗关闭 | `icon-close.svg` |
| IC18 | 相机 | 发布页拍照按钮 | `icon-camera.svg` |
| IC19 | 删除 | 图片删除按钮 | `icon-delete.svg` |
| IC20 | 统计发布 | 我的页面统计卡片 | `icon-stats-posted.svg` |
| IC21 | 统计审核 | 我的页面统计卡片 | `icon-stats-pending.svg` |
| IC22 | 统计完成 | 我的页面统计卡片 | `icon-stats-done.svg` |

---

## 十一、语义化颜色规则

审核状态 + 操作类型使用以下颜色映射：

| 场景 | CSS 变量名（新增） | 色值 Light | 色值 Dark | 用途 |
|---|---|---|---|---|
| 成功/已通过 | `--color-success` | `#10B981` | `#34D399` | 审核通过按钮、已办结状态标签 |
| 警告/审核中 | `--color-warning` | `#F59E0B` | `#FBBF24` | 待审核状态标签、待处理提醒 |
| 错误/已拒绝 | `--color-error` | `#EF4444` | `#F87171` | 拒绝按钮、被拒状态标签 |
| 信息/提示 | `--color-info` | `#3B82F6` | `#60A5FA` | 信息提示条、详情图标色 |

每色需配三个变体：
- `default`：标准色（文字/描边）
- `bg`：浅色 10%~15% opacity 背景
- `hover`：hover/focus 加深态

---

## 十二、实施建议

```
第一轮（P0，约 2 小时）
├── G01~G02  主题变量扩容（新颜色 + 新间距）
├── H01      首页 hero 去重 → 集成式
├── L01~L02  列表筛选分层 + 卡片类别图标
├── D01      详情行图标
├── A01~A02  审核卡片语义色 + 按钮区分
└── IC01~IC22  全部 SVG 图标

第二轮（P1，约 1.5 小时）
├── H02      首页分类图标
├── H03      操作卡片强调变体
├── L03      卡片按钮区分
├── P01~P02  发布页 focus 态 + 分类图标
├── D02~D03  详情页状态图标 + sticky 操作栏
├── M01~M02  我的页面头像 + 统计卡片
├── A03      审核缩略图
├── MP01~MP02  我的登记页状态色条 + tabs
└── T01      TabBar 选中态动效

第三轮（P2，约 1 小时）
├── G03~G05  backdrop fallback + 字体变量 + 动效
├── H04      首页标题栏 + 间距加宽
├── L04      空状态页
├── P03~P04  图片预览 + 提交反馈
├── D04      大图预览
├── M03      菜单图标
└── T02      发布按钮突出
```
