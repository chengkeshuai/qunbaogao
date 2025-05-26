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
            <button
              onClick={() => setShowQRCode(true)}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              title="微信公众号"
            >
              <i className="fab fa-weixin text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQRCode(false)}>
          <div 
            className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 relative animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              onClick={() => setShowQRCode(false)}
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">坤晟AI</h3>
              <div className="bg-[#2dc100] text-white rounded-lg py-2 px-4 mb-6 inline-block">
                <i className="fab fa-weixin mr-2"></i>
                微信公众号
              </div>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <Image
                  src="/qrcode.jpg"
                  width={200}
                  height={200}
                  alt="微信公众号二维码"
                  className="mx-auto"
                />
              </div>
              <p className="text-gray-600 text-sm">
                扫描上方二维码，关注公众号
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 