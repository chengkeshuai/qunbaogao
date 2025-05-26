export default function Footer() {
  return (
    <footer className="bg-gray-50 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-t border-gray-200 pt-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} 群报告 - HTML转可访问网页工具
          </p>
          <p className="text-center text-gray-400 text-xs mt-2">
            使用Cloudflare R2提供存储服务，Vercel提供部署服务
          </p>
        </div>
      </div>
    </footer>
  );
} 