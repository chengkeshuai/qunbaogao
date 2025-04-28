export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold text-gray-900">
              群报告
            </a>
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Beta</span>
          </div>
          <div>
            <a 
              href="https://github.com/your-github-username/qunbaogao" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  );
} 