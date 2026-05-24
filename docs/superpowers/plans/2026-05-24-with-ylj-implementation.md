# With Ylj 网站 — 实现计划

> **For agentic workers:** 使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务执行。步骤使用 `- [ ]` checkbox 格式。

**Goal:** 构建一个温暖日系风格的情侣日常记录网站，Astro 静态生成，Decap CMS 管理内容，GitHub Pages 部署。

**Architecture:** Astro 静态站点 + Tailwind CSS 样式 + Decap CMS（`/admin` 路径）。Markdown 内容存于 `src/content/posts/`，构建时生成静态 HTML，GitHub Actions 自动部署到 Pages。

**Tech Stack:** Astro v5, Tailwind CSS v4, Decap CMS, GitHub Pages, GitHub Actions

---

### 文件结构总览

```
withylj/
├── public/
│   ├── admin/
│   │   └── config.yml              # Decap CMS 配置
│   └── images/                     # 上传的图片（git LFS 可选）
├── src/
│   ├── content/
│   │   └── posts/                  # 博客文章 Markdown
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── PostCard.astro
│   │   └── TagChips.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro             # 首页
│   │   ├── timeline.astro          # 时间线
│   │   ├── albums.astro            # 相册/标签
│   │   ├── about.astro             # 关于我们
│   │   └── posts/
│   │       └── [slug].astro        # 文章详情
│   └── styles/
│       └── global.css              # Tailwind + 自定义样式
├── astro.config.mjs
├── package.json
└── .github/workflows/deploy.yml
```

---

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `src/styles/global.css`
- Create: `tsconfig.json`

- [ ] **Step 1: 创建 package.json 并安装依赖**

```bash
cd /d/withylj
npm create astro@latest . -- --template minimal --skip-houston --install
```

等 Astro 初始化完成后，安装额外依赖：

```bash
npx astro add tailwind
```

- [ ] **Step 2: 确认 package.json 结构**

`package.json` 应包含 `astro`, `@astrojs/tailwind`, `tailwindcss` 等依赖。

- [ ] **Step 3: 配置 astro.config.mjs**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://<your-username>.github.io',
  base: '/withylj',
});
```

- [ ] **Step 4: 写入全局样式**

`src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  --color-warm-pink: #d4786e;
  --color-warm-pink-light: #f8c8c4;
  --color-warm-bg: #fffcfc;
  --color-warm-bg-pink: #fff5f5;
  --color-warm-gray: #c0978c;
  --color-warm-border: #fce8e4;
}

body {
  font-family: 'Georgia', 'Noto Serif SC', serif;
  background-color: var(--color-warm-bg);
  color: #555;
}
```

- [ ] **Step 5: 验证项目能 build**

```bash
npm run build
```

预期：构建成功，`dist/` 目录生成。

- [ ] **Step 6: 初始化 Git 并提交**

```bash
git init
git add -A
git commit -m "chore: init Astro project with Tailwind CSS"
```

---

### Task 2: 基础布局 & 导航组件

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`

- [ ] **Step 1: 创建 BaseLayout**

`src/layouts/BaseLayout.astro`:

```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'With Ylj - 记录我们的小日子' } = Astro.props;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title} — With Ylj</title>
  </head>
  <body class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: 创建 Header 组件（含移动端汉堡菜单）**

`src/components/Header.astro`:

```astro
---
const navItems = [
  { href: '/', label: '首页' },
  { href: '/timeline', label: '时间线' },
  { href: '/albums', label: '相册' },
  { href: '/about', label: '关于' },
];
const currentPath = Astro.url.pathname;
---

<header class="border-b border-warm-border bg-warm-bg sticky top-0 z-10">
  <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="font-serif text-lg font-bold text-warm-pink">
      🌸 With Ylj
    </a>

    <!-- Desktop nav -->
    <nav class="hidden md:flex gap-6 text-sm">
      {navItems.map((item) => (
        <a
          href={item.href}
          class={currentPath === item.href
            ? 'text-warm-pink font-medium'
            : 'text-gray-400 hover:text-warm-pink transition-colors'}
        >
          {item.label}
        </a>
      ))}
    </nav>

    <!-- Mobile hamburger -->
    <button id="menu-toggle" class="md:hidden text-warm-pink text-xl" aria-label="菜单">
      ☰
    </button>
  </div>

  <!-- Mobile menu (hidden by default) -->
  <nav id="mobile-menu" class="hidden md:hidden border-t border-warm-border bg-warm-bg-pink px-4 py-2">
    {navItems.map((item) => (
      <a
        href={item.href}
        class="block py-2 text-sm text-gray-500 hover:text-warm-pink"
      >
        {item.label}
      </a>
    ))}
  </nav>
</header>

<script>
  const btn = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  btn?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
  });
</script>
```

- [ ] **Step 3: 创建 Footer 组件**

`src/components/Footer.astro`:

```astro
<footer class="text-center py-6 bg-warm-bg-pink border-t border-warm-border relative overflow-hidden">
  <span class="text-xs absolute top-2 left-6 opacity-10">🐾</span>
  <span class="text-xs absolute top-3 right-6 opacity-10">🐾</span>
  <p class="text-xs text-gray-400">With Ylj © {new Date().getFullYear()}</p>
  <p class="text-[10px] text-gray-300 mt-1">用 💕 记录每一天</p>
</footer>
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add base layout, header and footer"
```

---

### Task 3: PostCard & TagChips 组件

**Files:**
- Create: `src/components/PostCard.astro`
- Create: `src/components/TagChips.astro`

- [ ] **Step 1: 创建 PostCard 组件**

`src/components/PostCard.astro`:

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'posts'>;
}

const { post } = Astro.props;
const { title, date, cover, tags, summary } = post.data;
const coverUrl = cover ?? '/images/placeholder.jpg';
---

<article class="bg-warm-bg-pink rounded-2xl overflow-hidden border border-warm-border hover:shadow-md transition-shadow">
  <a href={`/posts/${post.id}`}>
    <div class="aspect-[4/3] bg-warm-pink-light/30 overflow-hidden">
      <img
        src={coverUrl}
        alt={title}
        class="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
    <div class="p-3">
      <h3 class="text-sm font-bold text-gray-700 leading-snug">{title}</h3>
      <p class="text-xs text-warm-gray mt-1">
        {new Date(date).toLocaleDateString('zh-CN')}
      </p>
      {tags && tags.length > 0 && (
        <div class="flex flex-wrap gap-1 mt-2">
          {tags.map((tag: string) => (
            <span class="bg-warm-pink-light/50 text-warm-pink text-[10px] px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </a>
</article>
```

- [ ] **Step 2: 创建 TagChips 组件**

`src/components/TagChips.astro`:

```astro
---
interface Props {
  tags: string[];
  activeTag?: string;
  baseUrl?: string;
}

const { tags, activeTag, baseUrl = '/albums' } = Astro.props;
---

<div class="flex flex-wrap justify-center gap-2">
  <a
    href={baseUrl}
    class:list={[
      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
      !activeTag
        ? 'bg-warm-pink text-white'
        : 'bg-warm-bg-pink text-warm-pink border border-warm-pink-light hover:bg-warm-pink-light/30',
    ]}
  >
    全部
  </a>
  {tags.map((tag) => (
    <a
      href={`${baseUrl}?tag=${encodeURIComponent(tag)}`}
      class:list={[
        'px-3 py-1 rounded-full text-xs font-medium transition-colors',
        activeTag === tag
          ? 'bg-warm-pink text-white'
          : 'bg-warm-bg-pink text-warm-pink border border-warm-pink-light hover:bg-warm-pink-light/30',
      ]}
    >
      {tag}
    </a>
  ))}
</div>
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add PostCard and TagChips components"
```

---

### Task 4: Content Collection 配置 + 示例文章

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/posts/hello-world.md`

- [ ] **Step 1: 定义 content collection schema**

`src/content/config.ts`:

```ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    weather: z.string().optional(),
  }),
});

export const collections = { posts };
```

- [ ] **Step 2: 创建第一篇示例文章**

`src/content/posts/hello-world.md`:

```md
---
title: "欢迎来到我们的小站"
date: 2024-05-20
cover: "/images/placeholder.jpg"
tags: ["日常"]
summary: "我们的网站正式上线啦！以后这里会记录我们在一起的点点滴滴。"
weather: "☀️ 晴"
---

今天是个特别的日子，我们的情侣网站正式上线了！🌸

以后这里会记录我和丽娟在一起的每一个美好瞬间。希望多年以后翻回来看，还能感受到此刻的幸福。

## 为什么做这个网站

想有一个只属于我们两个人的小角落，不用朋友圈，不用微博，就安安静静地记录我们的故事。
```

- [ ] **Step 3: 验证 build 通过**

```bash
npm run build
```

预期：构建成功，dist/ 中包含内容。

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: configure content collection and sample post"
```

---

### Task 5: 首页

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: 实现首页**

`src/pages/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import PostCard from '../components/PostCard.astro';
import TagChips from '../components/TagChips.astro';

const posts = await getCollection('posts');
const sortedPosts = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
const recentPosts = sortedPosts.slice(0, 6);

const allTags = [...new Set(posts.flatMap((p) => p.data.tags ?? []))];
---

<BaseLayout title="首页">
  <!-- Hero -->
  <section class="text-center py-12 px-4 bg-gradient-to-b from-warm-bg-pink to-warm-bg relative overflow-hidden">
    <div class="text-lg opacity-15 absolute top-4 left-6 select-none">✿ ✿ ✿</div>
    <div class="text-sm opacity-10 absolute top-6 right-8 select-none">･ ｡ ☆</div>
    <div class="text-base opacity-10 absolute bottom-6 left-5 select-none">♡ ♡</div>
    <div class="text-xs opacity-8 absolute bottom-4 right-6 select-none">・ ・ ・</div>

    <div class="text-5xl mb-3">🌸</div>
    <h1 class="font-serif text-3xl font-bold text-warm-pink">With Ylj</h1>
    <div class="w-10 h-0.5 bg-gradient-to-r from-transparent via-warm-pink-light to-transparent mx-auto my-3"></div>
    <p class="text-sm text-warm-gray leading-relaxed">
      记录和丽娟在一起的小日子<br/>
      每一张照片，都是我们的故事
    </p>
    <p class="text-xs text-gray-300 mt-3">— since 2024 —</p>
  </section>

  <!-- Divider -->
  <div class="text-center py-3 text-sm text-warm-pink-light/60 tracking-widest select-none">· · ✿ · ·</div>

  <!-- Recent Posts -->
  <section class="max-w-3xl mx-auto px-4 pb-6">
    <div class="text-center mb-4">
      <h2 class="text-base font-bold text-warm-pink">📝 最近更新</h2>
      <p class="text-xs text-warm-gray mt-1">点滴日常，都想珍藏</p>
    </div>

    {recentPosts.length > 0 ? (
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        {recentPosts.map((post) => <PostCard post={post} />)}
      </div>
    ) : (
      <p class="text-center text-gray-400 text-sm py-8">还没有文章，去后台添加第一篇吧~</p>
    )}

    {sortedPosts.length > 6 && (
      <div class="text-center mt-4">
        <a href="/timeline" class="inline-block bg-warm-bg-pink text-warm-pink px-5 py-1.5 rounded-full text-xs border border-warm-pink-light hover:bg-warm-pink-light/30 transition-colors">
          查看全部 →
        </a>
      </div>
    )}
  </section>

  <!-- Divider -->
  <div class="text-center py-3 text-base opacity-15 select-none">── ♡ ──</div>

  <!-- Tags -->
  {allTags.length > 0 && (
    <section class="max-w-3xl mx-auto px-4 pb-8">
      <div class="text-center mb-3">
        <h2 class="text-base font-bold text-warm-pink">🏷️ 话题</h2>
      </div>
      <TagChips tags={allTags} />
    </section>
  )}
</BaseLayout>
```

- [ ] **Step 2: 运行 dev server 验证**

```bash
npm run dev
```

打开浏览器检查首页渲染是否正常。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add home page"
```

---

### Task 6: 时间线页

**Files:**
- Create: `src/pages/timeline.astro`

- [ ] **Step 1: 实现时间线页**

`src/pages/timeline.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const posts = await getCollection('posts');
const sortedPosts = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title="时间线">
  <section class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="font-serif text-2xl font-bold text-warm-pink text-center mb-2">📅 时间线</h1>
    <p class="text-xs text-warm-gray text-center mb-8">按时间倒序，回顾我们的故事</p>

    {sortedPosts.length === 0 ? (
      <p class="text-center text-gray-400 py-12">还没有文章~</p>
    ) : (
      <div class="border-l-2 border-warm-pink-light/60 ml-2">
        {sortedPosts.map((post) => (
          <a href={`/posts/${post.id}`} class="block pl-4 pb-6 group">
            <time class="text-xs text-warm-gray mb-2 block">
              {new Date(post.data.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </time>
            <article class="bg-warm-bg-pink rounded-xl overflow-hidden border border-warm-border group-hover:shadow-md transition-shadow">
              {post.data.cover && (
                <img
                  src={post.data.cover}
                  alt={post.data.title}
                  class="w-full h-40 object-cover"
                  loading="lazy"
                />
              )}
              <div class="p-3">
                <h2 class="font-bold text-gray-700">{post.data.title}</h2>
                <p class="text-xs text-gray-400 mt-1 line-clamp-2">{post.data.summary}</p>
                {post.data.tags && post.data.tags.length > 0 && (
                  <div class="flex flex-wrap gap-1 mt-2">
                    {post.data.tags.map((tag: string) => (
                      <span class="bg-warm-pink-light/50 text-warm-pink text-[10px] px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </a>
        ))}
      </div>
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "feat: add timeline page"
```

---

### Task 7: 文章详情页

**Files:**
- Create: `src/pages/posts/[slug].astro`

- [ ] **Step 1: 实现文章详情页**

`src/pages/posts/[slug].astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { title, date, tags, summary, cover, weather } = post.data;

const allPosts = await getCollection('posts');
const sortedPosts = allPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
const currentIndex = sortedPosts.findIndex((p) => p.id === post.id);
const prevPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
const nextPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
---

<BaseLayout title={title} description={summary}>
  <article class="max-w-2xl mx-auto px-4 py-8">
    <header class="text-center mb-6">
      <h1 class="font-serif text-xl md:text-2xl font-bold text-warm-pink">{title}</h1>
      <div class="text-xs text-warm-gray mt-2">
        {new Date(date).toLocaleDateString('zh-CN', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
        })}
        {weather && ` · ${weather}`}
      </div>
      {tags && tags.length > 0 && (
        <div class="flex flex-wrap justify-center gap-1.5 mt-3">
          {tags.map((tag: string) => (
            <a href={`/albums?tag=${encodeURIComponent(tag)}`}
               class="bg-warm-pink-light/70 text-warm-pink text-[10px] px-2.5 py-0.5 rounded-full hover:bg-warm-pink-light transition-colors">
              {tag}
            </a>
          ))}
        </div>
      )}
    </header>

    {cover && (
      <img src={cover} alt={title} class="w-full rounded-xl mb-6" />
    )}

    <div class="prose prose-sm max-w-none text-gray-600 leading-relaxed">
      <Content />
    </div>

    <hr class="my-8 border-warm-border" />

    <nav class="flex justify-between text-sm">
      {prevPost ? (
        <a href={`/posts/${prevPost.id}`} class="text-warm-pink hover:underline">← {prevPost.data.title}</a>
      ) : <span />}
      {nextPost ? (
        <a href={`/posts/${nextPost.id}`} class="text-warm-pink hover:underline">{nextPost.data.title} →</a>
      ) : <span />}
    </nav>
  </article>
</BaseLayout>
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "feat: add post detail page"
```

---

### Task 8: 相册页

**Files:**
- Create: `src/pages/albums.astro`

- [ ] **Step 1: 实现相册页**

`src/pages/albums.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import PostCard from '../components/PostCard.astro';
import TagChips from '../components/TagChips.astro';

const posts = await getCollection('posts');
const sortedPosts = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
const allTags = [...new Set(posts.flatMap((p) => p.data.tags ?? []))];

const url = new URL(Astro.request.url);
const activeTag = url.searchParams.get('tag') || undefined;

const filteredPosts = activeTag
  ? sortedPosts.filter((p) => p.data.tags?.includes(activeTag))
  : sortedPosts;
---

<BaseLayout title={activeTag ? `${activeTag} · 相册` : '相册'}>
  <section class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="font-serif text-2xl font-bold text-warm-pink text-center mb-2">🖼️ 相册</h1>
    <p class="text-xs text-warm-gray text-center mb-6">
      {activeTag ? `正在查看 #${activeTag}` : '按话题浏览我们的照片'}
    </p>

    <div class="mb-8">
      <TagChips tags={allTags} activeTag={activeTag} />
    </div>

    {filteredPosts.length > 0 ? (
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filteredPosts.map((post) => <PostCard post={post} />)}
      </div>
    ) : (
      <p class="text-center text-gray-400 text-sm py-12">
        {activeTag ? '这个标签下还没有文章~' : '还没有文章~'}
      </p>
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "feat: add albums page"
```

---

### Task 9: 关于我们页

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: 实现关于页**

`src/pages/about.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="关于我们">
  <section class="max-w-md mx-auto px-4 py-12 text-center">
    <div class="text-4xl mb-3">🌸</div>
    <h1 class="font-serif text-2xl font-bold text-warm-pink mb-4">关于我们</h1>

    <div class="w-28 h-28 mx-auto mb-4 rounded-full bg-warm-pink-light/30 flex items-center justify-center text-3xl text-warm-pink/50 overflow-hidden">
      <img
        src="/images/us.jpg"
        alt="我们"
        class="w-full h-full object-cover"
        onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
      />
      <span style="display:none">💕</span>
    </div>

    <p class="text-sm text-gray-600 leading-loose mb-5">
      这个网站用来记录我和丽娟在一起的点点滴滴。<br/>
      生活里的每一个瞬间，都值得被记住。<br/>
      谢谢你来看我们的故事 💕
    </p>

    <div class="w-8 h-px bg-warm-pink-light/60 mx-auto mb-2"></div>
    <p class="text-xs text-warm-gray">—— Y &amp; L</p>
  </section>
</BaseLayout>
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "feat: add about page"
```

---

### Task 10: Decap CMS 配置

**Files:**
- Create: `public/admin/config.yml`
- Create: `public/admin/index.html`

- [ ] **Step 1: 创建 Decap CMS 配置文件**

`public/admin/config.yml`:

```yaml
backend:
  name: git-gateway
  branch: main

media_folder: "public/images"
public_folder: "/images"

collections:
  - name: "posts"
    label: "文章"
    folder: "src/content/posts"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - { label: "标题", name: "title", widget: "string" }
      - { label: "日期", name: "date", widget: "datetime", format: "YYYY-MM-DD" }
      - { label: "封面图", name: "cover", widget: "image", required: false }
      - { label: "标签", name: "tags", widget: "list", default: ["日常"] }
      - { label: "摘要", name: "summary", widget: "text" }
      - { label: "天气", name: "weather", widget: "string", required: false }
      - { label: "正文", name: "body", widget: "markdown" }
```

- [ ] **Step 2: 创建 Decap CMS 入口 HTML**

`public/admin/index.html`:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>With Ylj — 内容管理</title>
</head>
<body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add Decap CMS configuration"
```

---

### Task 11: GitHub Actions 部署配置

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建 GitHub Actions workflow**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "chore: add GitHub Actions deploy workflow"
```

---

### Task 12: 最终验证

- [ ] **Step 1: Build 检查**

```bash
npm run build
```

确认 `dist/` 目录包含所有页面的 HTML 文件，无报错。

- [ ] **Step 2: 启动 dev server 手动抽查**

```bash
npm run dev
```

在浏览器中依次检查：
- 首页渲染（Hero、卡片、标签云）
- `/timeline` 时间线页
- `/albums` 相册页
- `/albums?tag=日常` 标签筛选
- `/about` 关于页
- `/posts/hello-world` 文章详情
- 缩小浏览器窗口验证响应式（移动端汉堡菜单）

- [ ] **Step 3: 添加 `.gitignore` 中确认 `dist/` 和 `.superpowers/` 被忽略**

`.gitignore` 至少包含：

```
dist/
.superpowers/
node_modules/
```

- [ ] **Step 4: 最终提交**

```bash
git add -A && git commit -m "chore: final verification and gitignore"
```

---

### Task 13: 推送到 GitHub 并启用 Pages

> 此步骤需要用户手动在 GitHub 上操作。

- [ ] **Step 1: 在 GitHub 创建仓库 `withylj`**
- [ ] **Step 2: 关联远程并推送**

```bash
git remote add origin https://github.com/<your-username>/withylj.git
git push -u origin main
```

- [ ] **Step 3: 在 GitHub 仓库 Settings → Pages → Source 选择 "GitHub Actions"**
- [ ] **Step 4: 等待 Actions 运行完成，访问 `https://<your-username>.github.io/withylj/`**
- [ ] **Step 5: 访问 `https://<your-username>.github.io/withylj/admin/` 使用 Decap CMS 后台**

> **注意：** Decap CMS 使用 `git-gateway` backend 需要额外配置 OAuth 认证（如 Netlify Identity 或自建 OAuth server）。如果暂时不需要网页端编辑，可以本地直接编辑 Markdown 文件然后 push。后续需要 CMS 时再配置认证。
