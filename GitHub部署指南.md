# GitHub Pages 部署指南

## 步骤 1: 启用 GitHub Pages

1. 访问 https://github.com/Zhijun622/big_data_test
2. 点击 **Settings**（设置）
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 部分选择：
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `root`
   - 点击 **Save**

## 步骤 2: 配置 GitHub Actions（推荐）

### 方法 A: 使用 GitHub Actions 自动部署

1. 在仓库页面，点击 **Actions** 标签
2. 点击 **New workflow**
3. 选择 **Set up a workflow yourself**
4. 将以下内容复制到编辑器中：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

5. 点击 **Start commit**，然后 **Commit new file**
6. 回到 **Settings > Pages**，将 Source 改为 **GitHub Actions**

### 方法 B: 手动构建和部署

如果无法使用 GitHub Actions，可以手动构建：

1. 本地运行：
```bash
npm install
npm run build
```

2. 将 `dist` 目录的内容推送到 `gh-pages` 分支：
```bash
git subtree push --prefix dist origin gh-pages
```

3. 在 Settings > Pages 中选择 `gh-pages` 分支

## 步骤 3: 访问网站

部署完成后（通常需要几分钟），访问：

**https://zhijun622.github.io/big_data_test/**

## 注意事项

1. **Base路径**: 已配置为 `/big_data_test/`，与仓库名称一致
2. **路由**: 使用 `BrowserRouter` 的 `basename` 属性支持子路径
3. **首次部署**: 可能需要等待几分钟才能访问
4. **更新部署**: 每次推送到 `main` 分支，GitHub Actions 会自动重新部署

## 故障排除

### 如果网站显示 404

1. 检查 Settings > Pages 中的 Source 设置
2. 确认 Actions 工作流已成功运行
3. 等待几分钟后刷新页面

### 如果路由不工作

确保 `vite.config.js` 中的 `base` 设置为 `/big_data_test/`
确保 `src/App.jsx` 中的 `BrowserRouter` 有 `basename="/big_data_test"`

### 如果静态资源加载失败

确保 `public/questions.json` 文件已正确提交到仓库

