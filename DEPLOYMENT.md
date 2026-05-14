# 部署指南

## 🚀 部署到 Vercel（推荐）

### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2：登录 Vercel

```bash
vercel login
```

### 步骤 3：部署项目

```bash
cd /Users/yangtao/Desktop/yang-tao-creative-portfolio
vercel --prod
```

### 步骤 4：配置环境变量

部署时会提示输入环境变量：

- `VITE_SUPABASE_URL`: `https://acyzltuikvznpkncqnzc.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: 你的 Supabase 匿名密钥

## 📝 手动配置环境变量

如果部署时没有配置，可以在 Vercel 控制台中：

1. 进入你的项目
2. 点击 **Settings** → **Environment Variables**
3. 添加以下变量：

| 变量名                   | 值                                         |
| ------------------------ | ------------------------------------------ |
| `VITE_SUPABASE_URL`      | `https://acyzltuikvznpkncqnzc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | 你的 Supabase 匿名密钥                     |

## 🔧 其他部署选项

### Netlify

```bash
npm install -g netlify-cli
netlify init
netlify deploy --prod
```

### 静态文件部署

构建产物在 `dist` 目录，可以直接部署到任何静态托管服务。

## ✅ 部署检查清单

- [ ] Supabase 数据库表已创建
- [ ] Supabase 存储桶已配置
- [ ] 环境变量已设置
- [ ] 构建成功（`npm run build`）

## 📡 访问网站

部署成功后，你会得到一个类似这样的 URL：

```
https://yang-tao-creative-portfolio.vercel.app
```

## 🔒 管理后台

访问网站后，点击右下角 ⚙️ 图标，输入密码 `yangtao666` 进入管理后台。
