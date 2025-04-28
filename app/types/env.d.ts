declare namespace NodeJS {
  interface ProcessEnv {
    // Cloudflare R2 配置
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    R2_PUBLIC_URL: string;
    
    // 网站配置
    NEXT_PUBLIC_SITE_URL: string;
  }
} 