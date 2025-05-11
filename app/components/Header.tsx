'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  // 定义导航链接
  const navLinks = [
    { name: 'HTML工具', href: '/' },
    { name: '聊天转网页', href: '/chat' },
  ];
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logos/logo.svg" 
                width={32} 
                height={32} 
                alt="群报告" 
                className="mr-2 flex-shrink-0" 
                style={{ transform: 'translateY(1px)' }}
              />
              <span className="text-2xl font-bold text-gray-900 flex-shrink-0">群报告</span>
            </Link>
            <span className="ml-2 text-sm bg-[#e6f9e6] text-[#2dc100] px-2 py-0.5 rounded">正式版</span>
            
            {/* 导航链接 */}
            <nav className="hidden md:flex ml-8">
              <ul className="flex space-x-6">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`text-base font-medium transition-colors ${
                          isActive 
                            ? 'text-[#2dc100] border-b-2 border-[#2dc100] pb-1' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          <div>
            <a 
              href="https://github.com/chengkeshuai/qunbaogao" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#2dc100] hover:text-[#249c00]"
            >
              GitHub
            </a>
          </div>
        </div>
        
        {/* 移动端导航 */}
        <div className="md:hidden mt-3">
          <div className="flex space-x-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive 
                      ? 'bg-[#e6f9e6] text-[#2dc100]' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
} 