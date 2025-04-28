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
              <svg className="w-8 h-8 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 374.999991" fill="none">
                <defs>
                  <clipPath id="d2d59c5b2b">
                    <path d="M 23.183594 1 L 343 1 L 343 211 L 23.183594 211 Z M 23.183594 1 " clipRule="nonzero"/>
                  </clipPath>
                </defs>
                <path fill="#2dc100" d="M 28.03125 233.644531 L 80.582031 233.644531 L 80.582031 375 L 28.03125 375 Z M 28.03125 233.644531 " fillOpacity="1" fillRule="nonzero"/>
                <path fill="#2dc100" d="M 118.535156 183.410156 L 171.082031 183.410156 L 171.082031 375 L 118.535156 375 Z M 118.535156 183.410156 " fillOpacity="1" fillRule="nonzero"/>
                <path fill="#2dc100" d="M 208.453125 199.765625 L 261 199.765625 L 261 375 L 208.453125 375 Z M 208.453125 199.765625 " fillOpacity="1" fillRule="nonzero"/>
                <path fill="#2dc100" d="M 298.371094 127.335938 L 350.917969 127.335938 L 350.917969 374.414062 L 298.371094 374.414062 Z M 298.371094 127.335938 " fillOpacity="1" fillRule="nonzero"/>
                <g clipPath="url(#d2d59c5b2b)">
                  <path fill="#2dc100" d="M 308.296875 82.945312 C 311.800781 86.449219 318.222656 85.28125 319.972656 80.023438 L 342.160156 10.515625 C 343.914062 5.257812 338.65625 0 333.402344 1.753906 L 263.921875 23.363281 C 259.25 25.117188 257.496094 30.957031 261 35.046875 L 277.933594 51.984375 L 199.109375 131.425781 L 140.722656 73.015625 L 23.945312 189.835938 L 44.378906 210.28125 L 140.722656 113.902344 L 199.109375 172.3125 L 298.371094 73.015625 Z M 308.296875 82.945312 " fillOpacity="1" fillRule="nonzero"/>
                </g>
              </svg>
              <span className="text-2xl font-bold text-gray-900">群报告</span>
            </Link>
            <span className="ml-2 text-sm bg-[#e6f9e6] text-[#2dc100] px-2 py-0.5 rounded">正式版</span>
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