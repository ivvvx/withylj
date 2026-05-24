# With Ylj — 网站设计文档

## 概述

**With Ylj** 是一个情侣日常记录网站，用于记录和分享与姚丽娟（YLJ）的生活点滴。以图片为主、文字为辅，采用时间线 + 标签分类的混合浏览模式。

## 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | Astro | 静态网站生成，对图片内容友好 |
| 样式 | Tailwind CSS | 响应式优先，快速实现温暖日系风格 |
| CMS | Decap CMS | 免费 Git-based，网页端编辑，内容存于 GitHub 仓库 |
| 托管 | GitHub Pages | 免费，每次推送自动部署 |
| CI/CD | GitHub Actions | Astro 构建 + 部署到 Pages |

## 数据流

```
你在 Decap CMS 写文章/传图 → GitHub 仓库 (Markdown + 图片)
→ GitHub Actions 构建 Astro → GitHub Pages 展示
```

所有内容以 Markdown 文件形式存放在仓库的 `src/content/posts/` 目录下，图片存放在 `public/images/` 下。

## 站点结构

- **首页 `/`** — Hero 封面 + 最近更新的文章卡片 + 话题标签云
- **时间线 `/timeline`** — 按日期倒序排列所有文章
- **相册 `/albums`** — 按标签筛选的瀑布流/网格视图
- **关于 `/about`** — 合照 + 简短介绍
- **文章详情 `/posts/:slug`** — 单篇文章完整内容 + 图片 + 前后篇导航

## 视觉风格：温暖日系

- **配色**：粉白 (#fffcfc, #fff5f5) + 浅樱色 (#d4786e, #f8c8c4) + 暖灰 (#c0978c)
- **排版**：衬线字体标题 + 圆角卡片 + 充分留白
- **装饰**：散布的 ✿♡☆🐾 符号（低透明度），分割线用 `··✿··` 替代横线
- **氛围**：温馨、柔软、像一本手账

## 响应式适配

Mobile First 策略，使用 Tailwind CSS 断点：

| 断点 | 屏幕 | 布局变化 |
|---|---|---|
| 默认 | <768px | 汉堡菜单、2 列卡片、单列时间线、图片全宽 |
| md | ≥768px | 顶部导航展开、3 列卡片 |
| lg | ≥1024px | 内容最大宽度 960px 居中 |

## 文章数据结构

每篇文章（Markdown frontmatter）：

```yaml
title: string        # 标题
date: date           # 日期
cover: string        # 封面图路径
tags: string[]       # 标签，如 ["日常", "春日", "旅行"]
summary: string      # 摘要
weather: string?     # 可选：天气
---
正文内容（Markdown，图片混排）
```

## 页面清单

1. **首页** — Hero（标题+简介+slogan）+ 最近 3-6 篇文章卡片 + 标签云 + 页脚
2. **时间线** — 左侧时间轴竖线 + 文章卡片列表 + 分页/加载更多
3. **相册** — 顶部标签筛选栏 + 文章网格（2 列/3 列）+ 空态提示
4. **关于** — 合照 + 简介文字
5. **文章详情** — 标题/日期/天气/标签 + 正文图片混排 + 上一篇/下一篇

## 不需实现

- 评论功能
- 用户登录/注册
- 搜索功能
- 图片懒加载以外的高级优化（第一版不做）

## 部署配置

- GitHub 仓库名：`withylj`（用户名为 ${username}，则 Pages URL 为 `https://${username}.github.io/withylj/`）
- Astro 配置 `site` 和 `base` 需与之对应
- Decap CMS 配置文件：`public/admin/config.yml`，backend 使用 `git-gateway` 或直接 `github` repo 模式
- GitHub Actions workflow：`.github/workflows/deploy.yml`，监听 main 分支 push，执行 `npm run build`，部署到 `gh-pages` 分支
