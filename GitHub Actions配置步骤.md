# GitHub Actions 自动部署配置步骤

由于GitHub的安全限制，工作流文件需要在GitHub网页上手动创建。请按照以下步骤操作：

## 步骤 1: 在GitHub上创建工作流文件

1. 访问你的仓库：https://github.com/Zhijun622/big_data_test

2. 点击仓库顶部的 **Actions** 标签

3. 如果这是第一次使用Actions，点击 **set up a workflow yourself**（自己设置工作流）
   - 如果已经使用过Actions，点击 **New workflow** → **set up a workflow yourself**

4. 在编辑器中，将文件名改为：`.github/workflows/deploy.yml`

5. 复制以下内容到编辑器：

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

6. 点击右上角的 **Start commit**（开始提交）

7. 填写提交信息（可选），然后点击 **Commit new file**（提交新文件）

## 步骤 2: 启用 GitHub Pages

1. 在仓库页面，点击 **Settings**（设置）

2. 在左侧菜单找到 **Pages**

3. 在 **Source** 部分：
   - 选择 **GitHub Actions**（而不是 "Deploy from a branch"）
   - 点击 **Save**（保存）

## 步骤 3: 等待自动部署

1. 回到 **Actions** 标签页

2. 你应该能看到一个正在运行的工作流（workflow run）

3. 等待几分钟，直到工作流完成（显示绿色的 ✓）

4. 部署完成后，访问你的网站：
   **https://zhijun622.github.io/big_data_test/**

## 验证部署

- 工作流成功运行后，在 **Settings > Pages** 中会显示部署状态
- 网站地址会显示在 Pages 设置页面的顶部

## 后续更新

以后每次你推送代码到 `main` 分支时，GitHub Actions 会自动：
1. 安装依赖
2. 构建项目
3. 部署到 GitHub Pages

无需手动操作！

## 故障排除

### 如果工作流失败

1. 点击失败的 workflow run
2. 查看错误信息
3. 常见问题：
   - **npm ci 失败**：检查 package.json 和 package-lock.json 是否已提交
   - **构建失败**：检查代码是否有语法错误
   - **部署失败**：确保已启用 GitHub Pages 并选择 GitHub Actions 作为源

### 如果网站显示 404

1. 等待几分钟（首次部署需要时间）
2. 检查 Actions 是否成功运行
3. 确认 Pages 设置中选择了 GitHub Actions

