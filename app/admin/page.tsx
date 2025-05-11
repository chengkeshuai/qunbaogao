import SoftwareUploader from '../components/SoftwareUploader';
import TemplateUploader from '../components/TemplateUploader';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-[#2dc100] mb-6">管理控制台</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SoftwareUploader />
        
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">软件管理说明</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>上传留痕软件：在左侧上传最新版本的留痕软件，用于用户下载</li>
            <li>上传后的软件将自动替换之前的版本</li>
            <li>软件仅支持.exe格式文件</li>
            <li>上传成功后，用户将可通过网站下载最新版本</li>
          </ul>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TemplateUploader />
        
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">模板管理说明</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>上传暗黑华丽风格模板：更新用于生成精美网页的模板</li>
            <li>模板文件必须是.txt格式</li>
            <li>模板将应用于所有选择"暗黑华丽风格"的用户</li>
            <li>上传新模板后，旧模板将被替换</li>
            <li>建议保持模板HTML结构一致，仅修改内容和样式</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 