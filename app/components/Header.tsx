'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [showQRCode, setShowQRCode] = useState(false);

  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/logos/logo.svg" 
                width={32} 
                height={32} 
                alt="群报告" 
                className="mr-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" 
              />
              <span className="text-2xl font-bold text-gray-900 flex-shrink-0 transition-colors duration-200 group-hover:text-[#2dc100]">
                群报告
              </span>
            </Link>
            <span className="ml-2 text-sm bg-[#e6f9e6] text-[#2dc100] px-2 py-0.5 rounded-full font-medium">
              正式版
            </span>
          </div>
          
          {/* 导航链接 */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/tutorial" 
              className="text-gray-600 hover:text-[#2dc100] transition-colors duration-200 font-medium"
            >
              使用教程
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="https://github.com/chengkeshuai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              title="GitHub"
            >
              <i className="fab fa-github text-xl"></i>
            </a>
            <a 
              href="https://x.com/chengks2008" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              title="Twitter/X"
            >
              <i className="fab fa-x-twitter text-xl"></i>
            </a>
            <div 
              className="relative"
              onMouseEnter={() => setShowQRCode(true)}
              onMouseLeave={() => setShowQRCode(false)}
            >
              <button
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                title="微信公众号"
              >
                <i className="fab fa-weixin text-xl"></i>
              </button>
              {showQRCode && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl p-4 z-50 animate-fade-in transform-gpu">
                  <div className="text-center w-[200px]">
                    <h3 className="text-lg font-semibold mb-2">坤晟AI</h3>
                    <div className="bg-[#2dc100] text-white rounded-lg py-1 px-3 mb-3 inline-block text-sm">
                      <i className="fab fa-weixin mr-1"></i>
                      微信公众号
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg shadow-inner">
                      <Image
                        src="/images/qrcode.png"
                        width={300}
                        height={300}
                        alt="微信公众号二维码"
                        className="mx-auto w-[150px] h-[150px] select-none"
                        priority
                        quality={100}
                        draggable={false}
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-3">
                      扫码关注公众号
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 