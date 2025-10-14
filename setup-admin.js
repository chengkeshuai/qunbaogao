#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 设置管理后台账号...\n');

// 生成随机密钥
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 读取用户输入
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => {
  readline.question(query, resolve);
});

async function setupAdmin() {
  try {
    console.log('请设置管理后台账号信息：\n');
    
    const username = await question('用户名 (默认: admin): ') || 'admin';
    const password = await question('密码 (默认: admin123): ') || 'admin123';
    
    const secret = generateSecret();
    
    console.log('\n✅ 配置信息：');
    console.log(`用户名: ${username}`);
    console.log(`密码: ${password}`);
    console.log(`会话密钥: ${secret.substring(0, 16)}...`);
    
    // 创建或更新 .env.local 文件
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 更新或添加管理后台配置
    const lines = envContent.split('\n');
    const newLines = [];
    let foundAdminConfig = false;
    
    for (const line of lines) {
      if (line.startsWith('ADMIN_USERNAME=') || 
          line.startsWith('ADMIN_PASSWORD=') || 
          line.startsWith('ADMIN_SESSION_SECRET=')) {
        if (!foundAdminConfig) {
          newLines.push(`ADMIN_USERNAME=${username}`);
          newLines.push(`ADMIN_PASSWORD=${password}`);
          newLines.push(`ADMIN_SESSION_SECRET=${secret}`);
          foundAdminConfig = true;
        }
      } else if (line.trim() !== '') {
        newLines.push(line);
      }
    }
    
    if (!foundAdminConfig) {
      newLines.push('');
      newLines.push('# 管理后台配置');
      newLines.push(`ADMIN_USERNAME=${username}`);
      newLines.push(`ADMIN_PASSWORD=${password}`);
      newLines.push(`ADMIN_SESSION_SECRET=${secret}`);
    }
    
    fs.writeFileSync(envPath, newLines.join('\n'));
    
    console.log('\n🎉 配置完成！');
    console.log(`📁 配置文件已保存到: ${envPath}`);
    console.log('\n📝 下一步：');
    console.log('1. 重启开发服务器: npm run dev');
    console.log('2. 访问管理后台: http://localhost:3000/admin');
    console.log('3. 使用上面设置的账号登录');
    
  } catch (error) {
    console.error('❌ 配置失败:', error.message);
  } finally {
    readline.close();
  }
}

setupAdmin();
