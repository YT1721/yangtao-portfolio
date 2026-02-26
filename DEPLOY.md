# Supabase 部署指南

## 概述

项目已集成 Supabase 数据库，实现云端数据存储。配置完成后，你可以在后台直接上传图片、添加项目，**无需重新部署**即可生效。

---

## 第一步：创建 Supabase 项目

1. 访问 https://supabase.com
2. 用 GitHub 账号登录
3. 点击 "New Project"
4. 填写：
   - **Organization**: 选择或创建
   - **Project Name**: `yangtao-portfolio`
   - **Database Password**: 设置强密码（保存好！）
   - **Region**: 选择 `Singapore`（离中国最近）
5. 等待创建完成（约 2 分钟）

---

## 第二步：获取 API 密钥

项目创建完成后：

1. 进入项目 Dashboard
2. 点击左侧菜单 **Project Settings** → **API**
3. 复制以下信息：
   - **Project URL** (如: `https://xxxxx.supabase.co`)
   - **anon public** API key (如: `eyJhbGciOiJIUzI1NiIs...`)

---

## 第三步：配置环境变量

编辑 `.env.local` 文件，填入你的 Supabase 配置：

```bash
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## 第四步：创建数据库表

在 Supabase Dashboard 中：

1. 点击左侧 **SQL Editor**
2. 新建查询，粘贴以下 SQL：

```sql
-- 创建设置表（存储个人资料和项目数据）
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 启用 RLS（行级安全）
alter table settings enable row level security;

-- 创建允许匿名访问的策略（仅用于读取）
create policy "Allow anonymous read"
  on settings for select
  to anon
  using (true);

-- 创建允许匿名更新的策略（生产环境建议添加身份验证）
create policy "Allow anonymous update"
  on settings for all
  to anon
  using (true)
  with check (true);
```

3. 点击 **Run** 执行

---

## 第五步：创建存储桶（用于图片上传）

1. 点击左侧 **Storage**
2. 点击 **New bucket**
3. 输入名称：`portfolio`
4. 取消勾选 "Restrict public access"（允许公开访问）
5. 点击 **Save**

### 设置存储桶权限

1. 点击 `portfolio` 存储桶
2. 点击 **Policies** → **New policy**
3. 选择 **For full customization**
4. 粘贴以下策略：

```sql
-- 允许匿名上传
create policy "Allow anonymous uploads"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'portfolio');

-- 允许匿名读取
create policy "Allow anonymous select"
  on storage.objects for select
  to anon
  using (bucket_id = 'portfolio');

-- 允许匿名删除
create policy "Allow anonymous delete"
  on storage.objects for delete
  to anon
  using (bucket_id = 'portfolio');
```

---

## 第六步：测试部署

1. 本地测试：
   ```bash
   npm run dev
   ```

2. 进入后台管理，检查是否显示 "云端已连接"

3. 添加一个测试项目，查看是否自动保存

---

## 第七步：部署到生产环境

### 方式一：Vercel（推荐）

1. 推送代码到 GitHub
2. 访问 https://vercel.com
3. 导入项目
4. 在 **Environment Variables** 中添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. 部署

### 方式二：Netlify

1. 推送代码到 GitHub
2. 访问 https://netlify.com
3. 导入项目
4. 在 **Site settings** → **Environment variables** 中添加配置
5. 部署

---

## 使用说明

### 配置完成后

1. **自动保存**：所有修改会自动同步到云端
2. **图片上传**：自动上传到 Supabase Storage，获得 CDN 链接
3. **实时生效**：更新内容后，所有访问者立即看到最新版本
4. **无需重新部署**：告别导出代码、重新构建的繁琐流程

### 数据备份

虽然数据保存在云端，但建议定期导出备份：

1. 进入后台 → 部署与导出
2. 点击 "生成 constants.tsx 源码"
3. 保存代码文件作为备份

---

## 故障排查

### 问题：显示 "未配置 Supabase"

**解决**：
1. 检查 `.env.local` 文件是否正确配置
2. 确认环境变量名是 `VITE_` 开头（不是 `REACT_APP_`）
3. 重启开发服务器

### 问题：图片上传失败

**解决**：
1. 检查 Storage bucket `portfolio` 是否创建
2. 检查存储桶权限策略是否正确设置
3. 查看浏览器控制台错误信息

### 问题：数据保存失败

**解决**：
1. 检查 `settings` 表是否创建
2. 检查 RLS 策略是否正确设置
3. 在 Supabase Dashboard 查看 Database → Logs

---

## 安全建议（生产环境）

当前配置允许匿名访问，适合个人使用。如需更高安全性：

1. **添加身份验证**：使用 Supabase Auth 保护后台
2. **限制更新权限**：只允许特定用户修改数据
3. **启用 CORS**：限制可访问的域名

需要我帮你实现身份验证功能吗？
