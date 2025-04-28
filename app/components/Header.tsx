'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              群报告
            </Link>
            <span className="ml-2 text-sm bg-[#e6f9e6] text-[#2dc100] px-2 py-0.5 rounded">Beta</span>
          </div>
          <div>
            <a 
              href="https://github.com/your-github-username/qunbaogao" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#2dc100] hover:text-[#249c00]"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  );
} 