'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
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
      </div>
    </header>
  );
} 