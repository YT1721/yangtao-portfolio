<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 杨涛创意作品集 | Yang Tao Creative Portfolio

一个创新且设计感十足的个人作品集网站，展示杨涛作为资深设计总监 & AI 专家的 18+ 年行业经验。

## 项目简介

本项目是一个基于 React + TypeScript + Vite 构建的现代化个人作品集网站，采用深色主题设计，突出展示：

- **个人简介**：资深设计总监 & AI 专家的完整职业履历
- **核心技能**：AI 技术应用、传统设计能力、软件熟练度可视化展示
- **项目作品**：支持分类筛选的作品集展示（AI 视频、设计项目、品牌设计）
- **后台管理**：内置管理员系统，支持内容实时编辑与导出

## 技术栈

- **框架**：React 19.2.4
- **语言**：TypeScript 5.8.2
- **构建工具**：Vite 6.2.0
- **样式**：Tailwind CSS（通过 CDN 引入）
- **图标**：Material Symbols

## 功能特性

### 前端展示
- 响应式设计，适配桌面和移动设备
- 深色主题，现代感十足的 UI 设计
- 流畅的动画效果和交互体验
- 作品分类筛选功能
- 项目详情页支持图片画廊展示

### 后台管理系统
- 密码保护的管理员入口（默认密码：`yangtao666`）
- 个人资料编辑（姓名、简介、形象照片等）
- 项目管理（添加、编辑、删除项目，上传封面和画廊图片）
- 数据本地存储（localStorage）
- 一键导出全站配置源码

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装步骤

1. 克隆项目并进入目录：
   ```bash
   git clone <repository-url>
   cd yang-tao-creative-portfolio
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   - 复制 `.env.local` 文件并设置你的 Gemini API 密钥（如需要）：
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```
   访问 http://localhost:3000 查看应用

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
├── App.tsx              # 主应用组件（含前端展示和后台管理）
├── constants.tsx        # 默认数据配置（个人信息、项目、技能等）
├── types.ts             # TypeScript 类型定义
├── index.tsx            # 应用入口
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
├── package.json         # 项目依赖
└── .env.local           # 环境变量（需自行创建）
```

## 核心数据配置

项目数据存储在 `constants.tsx` 中，包含：

- `PERSONAL_INFO` - 个人基本信息
- `ABILITY_SCORES` - 核心素质评分
- `SOFTWARE_SKILLS` - 软件应用能力
- `AI_SKILLS` - AI 相关技能
- `TRADITIONAL_SKILLS` - 传统设计技能
- `PROJECTS` - 作品集数据
- `EXPERIENCE` - 工作经历
- `CUSTOMER_LOGOS` - 客户品牌列表

## 后台管理使用说明

1. 点击页面右下角隐藏的设置图标进入管理后台
2. 输入管理员密码（默认：`yangtao666`）
3. 在后台可以：
   - **资料设置**：修改个人简介、上传形象照片
   - **项目库**：添加/编辑/删除项目，上传封面和详情图片
   - **部署与导出**：生成并复制全站配置源码

## 自定义修改

### 修改管理员密码
编辑 `App.tsx` 文件中的 `ADMIN_PASSWORD` 常量：
```typescript
const ADMIN_PASSWORD = "你的新密码";
```

### 修改主题色
项目使用 Tailwind CSS，主色调为紫色（primary），可在样式类中搜索 `primary` 进行修改。

### 添加/修改项目
方式一：通过后台管理系统直接编辑
方式二：修改 `constants.tsx` 中的 `PROJECTS` 数组

## 许可证

MIT License

---

<div align="center">
  <sub>Built with React + TypeScript + Vite</sub>
</div>
