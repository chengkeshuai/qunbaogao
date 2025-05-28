'use client';

import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
  onClose: () => void;
  duration?: number; // Optional duration in ms, defaults to 3000
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type,
  show,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) {
    return null;
  }

  let bgColor = 'bg-blue-500';
  let textColor = 'text-white';
  let IconComponent = InformationCircleIcon;

  switch (type) {
    case 'success':
      bgColor = 'bg-green-500';
      IconComponent = CheckCircleIcon;
      break;
    case 'error':
      bgColor = 'bg-red-500';
      IconComponent = XCircleIcon;
      break;
    case 'info':
      bgColor = 'bg-sky-500'; // Sky blue for info
      IconComponent = InformationCircleIcon;
      break;
  }

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-30 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose} // Close on backdrop click
    >
      <div
        className={`transform transition-all duration-300 ease-out ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} ${bgColor} ${textColor} px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 max-w-sm w-auto m-4`}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking on toast itself
      >
        <IconComponent className="h-7 w-7 flex-shrink-0" />
        <span className="text-base font-medium">{message}</span>
        <button
          onClick={onClose}
          className={`ml-auto -mr-1 p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50`}
          aria-label="关闭通知"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification; 