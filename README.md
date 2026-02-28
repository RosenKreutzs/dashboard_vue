# 养老机构数据管理平台 



## 平台简介

这是一套专为现代养老机构设计的可视化后台管理系统。平台采用赛博朋克视觉风格，结合实时数据分析，旨在为管理人员提供直观、高效的决策支持。
## 功能特色

### 🖥️ 数据大屏 (Dashboard)
- **平台概览统计** - 实时展示已检测主机数、漏洞发现数、POC总数、EXP数量、AI分析准确率
- **CVE类型分布** - 饼状图展示不同CVE类型漏洞的分布情况
- **攻击类型统计** - 条形图展示各类型攻击的数量对比
- **漏洞分布热力图** - 展示不同CPU型号与操作系统的漏洞分布矩阵
- **增长趋势图** - 展示POC/EXP数量的周度变化趋势
- **AI分析流程示意** - 可视化展示代码上传到漏洞分析的完整流程
- **EXP生成流程** - 展示从漏洞识别到攻击代码生成的AI工作流
- **中国地图分布** - 动态展示各省份POC/EXP下载热度
- **漏洞知识库** - 展示平台收录的20+主流CPU漏洞

- **实时动态大屏 (Dashboard)：** - 对接 OpenWeatherMap 实时抓取重庆天气数据，动态展示温度趋势、空气质量及能见度变化。
- **老人信息系统：** - 支持按行动能力、健康指标（血糖、血压）进行筛选，可视化展示老人健康状态。
- **护工考评系统：** - 集成实时评分排名轨道，直观展示护工服务质量。
- **身份验证：** - 基于 SHA-256 哈希加密的账户体系，确保用户信息安全存储于 accounts.json。
- **路由守卫：** - 全全局 Token 校验拦截，防止未授权访问。
- **响应式布局：** - 完美适配大屏监控、桌面办公及移动端访问。

## 技术栈

### 前端技术
- **Vue 3** - 渐进式前端框架，采用Composition API
- **Vite** - 下一代前端构建工具
- **Pinia** -  Vue 3的状态管理解决方案
- **Vue Router** - Vue.js官方路由管理器
- **ECharts** - 强大的数据可视化图表库
- **@jiaminghi/data-view** - 数据大屏可视化组件库

### 开发工具
- **ESLint** - JavaScript/JSX代码检查
- **Vite Single File** - 单文件HTML打包插件

## 项目结构

```
NeuralCore/
├── backend/                # Flask 后端服务
│   └── app.py              # API 核心逻辑与天气对接
├── database/               # JSON 数据仓库
│   ├── accounts.json       # 账户信息 (SHA-256 加密)
│   ├── users.json          # 老人健康数据
│   ├── workers.json        # 护工基本资料
│   └── foods.json          # 膳食营养数据
├── src/                    # Vue 前端源码
│   ├── components/
│   │   └── layout/         # 核心布局组件 (AppLayout.vue)
│   ├── views/              # 页面视图 (Dashboard, User, Worker, Auth)
│   ├── router/             # 路由配置与安全守卫
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── public/                 # 静态资源
└── vite.config.js          # Vite 配置文件
```

## 快速开始

### 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

### 开发模式

```bash
npm run dev
```

启动后访问 http://localhost:5173

### 构建部署

```bash
# 标准构建（多文件输出）
npm run build

# 单文件构建（适合本地直接打开）
# 使用 vite-plugin-singlefile 插件
npm run build
```

构建输出在 `dist/` 目录

### 预览构建结果

```bash
npm run preview
```

## 部署方法

### 方法1：Web服务器部署
将 `dist` 目录内容部署到任意Web服务器（Nginx、Apache、IIS等）

### 方法2：单文件HTML部署
构建后的单文件 `dist/index.html` 可直接在浏览器打开（需要HTTP服务器避免CORS问题）

```bash
# 预览单文件
npm run preview
```

### 方法3：静态托管平台
可直接部署到 Vercel、Netlify、GitHub Pages 等平台


### Flask后端
位于 `backend/app.py`

```bash
cd backend
pip install -r requirements.txt
python app.py
```

前端默认连接 `http://localhost:5000`
1
