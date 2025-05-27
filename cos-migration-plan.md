# 腾讯云 COS 迁移执行计划

## 项目目标
将现有的 Cloudflare R2 存储迁移到腾讯云 COS，提升国内访问速度和微信兼容性

## 执行时间线
**开始时间**: 2025年5月26日
**预计完成**: 2025年6月2日（1周）

---

## 第一阶段：腾讯云服务开通（第1天 - 今天）

### 1.1 注册和认证 ✅ 已完成
- [x] 访问腾讯云官网：https://cloud.tencent.com/
- [x] 注册/登录腾讯云账号
- [x] 完成实名认证（个人/企业）
- [x] 查看新用户优惠政策

### 1.2 开通 COS 服务 ✅ 已完成
- [x] 进入对象存储 COS 控制台
- [x] 开通 COS 服务
- [x] 选择合适的地域：**亚太新加坡 (ap-singapore)**
- [x] 记录账号信息和地域代码

### 1.3 创建存储桶 ✅ 已完成
- [x] 创建存储桶名称：`qunbaogao-1302957102`
- [x] 设置访问权限：公有读私有写
- [x] 获取 API 密钥：`[YOUR_TENCENT_CLOUD_SECRET_ID]`
- [x] 配置跨域设置（CORS）：**已完成**

---

## 第二阶段：域名和 CDN 配置（第1-2天）

### 2.1 域名准备
- [ ] 确定使用的域名：**方案B - 使用腾讯云 CDN 分配的海外加速域名 (例如 xxx.cdn.dnsv1.com)，暂不使用自有域名，后期可优化为自有备案域名。**
- [ ] 检查域名是否已备案：**选择海外 CDN 节点，暂不需要备案**
- [ ] 如未备案，启动备案流程（可能需要1-2周）：**暂缓，后续按需进行**

### 2.2 CDN 配置
- [ ] 开通腾讯云 CDN 服务：**进行中**
- [ ] 添加加速域名 (`qunbaogao.com`)：**进行中 - 当前遇到 TXT 记录验证问题**
  - [ ] **在 `qunbaogao.com` 的域名解析服务商处，添加腾讯云 CDN 提供的 TXT 记录 (`_cdnauth`) 以完成域名所有权验证。**
  - [ ] **等待 DNS 记录生效后，返回腾讯云 CDN 控制台完成验证。**
- [ ] 获取腾讯云 CDN 分配的 CNAME 地址 (例如 `xxxx.cdn.dnsv1.com`)
- [ ] 配置源站（指向 COS 存储桶 `qunbaogao-1302957102`，区域 `ap-singapore`）
- [ ] 设置缓存规则（可先默认，后续优化）
- [ ] 申请 SSL 证书（推荐免费证书，开启 HTTPS）

### 2.3 DNS 配置
- [ ] 在域名服务商处将 `qunbaogao.com` (或您选择的子域名如 `static.qunbaogao.com`) 添加 CNAME 记录，指向腾讯云 CDN 分配的 CNAME 地址。
- [ ] 测试域名解析是否正常
- [ ] 验证 HTTPS 访问

---

## 第三阶段：代码迁移（第2-3天）

### 3.1 获取 API 密钥
- [ ] 在腾讯云控制台创建 API 密钥
- [ ] 记录 SecretId 和 SecretKey
- [ ] 配置合适的权限策略

### 3.2 安装依赖包
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
# 腾讯云 COS 兼容 S3 API，无需额外包
```

### 3.3 配置文件修改
- [ ] 创建 `lib/cos-client.ts` 文件
- [ ] 更新环境变量配置
- [ ] 修改上传逻辑
- [ ] 更新文件访问路径

### 3.4 测试环境验证
- [ ] 创建测试上传功能
- [ ] 验证文件上传成功
- [ ] 测试访问速度
- [ ] 检查微信内访问

---

## 第四阶段：部署和优化（第3-4天）

### 4.1 EdgeOne Pages 配置
- [ ] 修改 `next.config.js` 添加静态导出配置
- [ ] 更新图片优化设置
- [ ] 测试静态导出功能

### 4.2 生产环境部署
- [ ] 部署到 EdgeOne Pages
- [ ] 配置环境变量
- [ ] 测试完整流程

### 4.3 性能监控
- [ ] 配置访问日志
- [ ] 设置监控报警
- [ ] 测试不同地区访问速度

---

## 第五阶段：数据迁移和切换（第4-7天）

### 5.1 历史数据迁移
- [ ] 备份现有 Cloudflare R2 数据
- [ ] 批量迁移历史文件到 COS
- [ ] 更新数据库中的文件链接

### 5.2 灰度切换
- [ ] 新上传使用 COS
- [ ] 逐步迁移用户访问
- [ ] 监控错误和性能

### 5.3 完全切换
- [ ] 停止使用 Cloudflare R2
- [ ] 更新所有相关配置
- [ ] 验证所有功能正常

---

## 关键配置代码

### COS 客户端配置
```typescript
// lib/cos-client.ts
import { S3Client } from '@aws-sdk/client-s3';

export const cosClient = new S3Client({
  region: 'ap-beijing', // 或 ap-shanghai
  endpoint: 'https://cos.ap-beijing.myqcloud.com',
  credentials: {
    accessKeyId: process.env.COS_SECRET_ID!,
    secretAccessKey: process.env.COS_SECRET_KEY!,
  },
  forcePathStyle: false,
});

export const BUCKET_NAME = 'qunbaogao-static';
export const CDN_DOMAIN = 'https://static.qunbaogao.com';
```

### Next.js 配置
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  env: {
    COS_SECRET_ID: process.env.COS_SECRET_ID,
    COS_SECRET_KEY: process.env.COS_SECRET_KEY,
  }
}

module.exports = nextConfig
```

### 环境变量
```env
# .env.local
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=qunbaogao-static
COS_REGION=ap-beijing
CDN_DOMAIN=https://static.qunbaogao.com
```

---

## 预期收益

### 性能提升
- 国内访问速度提升 3-5倍
- 首屏加载时间 < 2秒
- 微信内完美打开

### 用户体验
- 微信生态完美兼容
- 更稳定的访问体验
- 更快的文件加载速度

### 业务指标
- 预期转化率提升 20%+
- 用户留存率提升 15%+
- 微信流量转化率提升 50%+

---

## 风险控制

### 技术风险
- 保留 Cloudflare R2 作为备份
- 分阶段迁移，降低影响
- 充分测试后再正式切换

### 成本风险
- 监控使用量，避免超出预算
- 利用新用户优惠政策
- 设置费用报警

### 业务风险
- 灰度发布，逐步切换
- 准备回滚方案
- 实时监控用户反馈

---

## 成功标准

### 技术指标
- [ ] 部署成功率 > 95%
- [ ] 平均加载速度 < 2秒
- [ ] 微信内访问成功率 > 99%

### 业务指标
- [ ] 用户投诉减少 > 80%
- [ ] 新用户转化率提升 > 20%
- [ ] 整体用户满意度提升

---

## 下一步行动

**立即开始（今天）：**
1. 访问腾讯云官网注册账号
2. 开通 COS 服务
3. 创建第一个存储桶
4. 获取 API 密钥

需要我继续协助您完成具体的技术实施步骤吗？ 