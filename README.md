# 群报告 - HTML转可访问网页工具

这是一个将HTML代码转换为可访问网页的工具，用户可以上传或粘贴HTML代码，系统会自动部署为可在多端设备访问的网页。

## 功能特点

- 支持HTML代码上传或粘贴
- 自动部署为可访问网页
- 生成独立访问链接
- 适配多端设备显示
- 使用Cloudflare R2进行云存储
- 通过Vercel进行应用部署

## 技术栈

- 前端：Next.js、React、TailwindCSS
- 后端：Next.js API Routes
- 存储：Cloudflare R2
- 部署：Vercel

## 开发环境设置

1. 克隆项目

```bash
git clone https://github.com/your-username/qunbaogao.git
cd qunbaogao
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

复制`env.sample`文件为`.env.local`，并填入相应的配置信息：

```bash
cp env.sample .env.local
```

4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## Cloudflare R2 配置

1. 在Cloudflare控制台创建R2存储桶
2. 创建API密钥，获取Access Key ID和Secret Access Key
3. 配置CORS策略允许从应用域名访问

## 部署到Vercel

1. 将代码推送到GitHub仓库
2. 在Vercel中导入GitHub项目
3. 配置环境变量
4. 完成部署后，可绑定自定义域名qunbaogao.com

## 许可证

[MIT](LICENSE)
