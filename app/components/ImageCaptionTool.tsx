'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Theme {
  height: number;
  fontSize: number;
  fontColor: string;
  outlineColor: string;
  fontFamily: string;
  fontWeight: string;
}

interface CustomThemes {
  [key: string]: Theme;
}

export default function ImageCaptionTool() {
  // 状态管理
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // 字幕设置状态
  const [captionHeight, setCaptionHeight] = useState(40);
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState('bold');
  const [activeTheme, setActiveTheme] = useState('default');

  // 自定义主题
  const [customThemes, setCustomThemes] = useState<CustomThemes>({});
  const [newThemeName, setNewThemeName] = useState('');

  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 默认主题预设
  const defaultThemes: { [key: string]: Theme } = {
    default: {
      height: 40,
      fontSize: 24,
      fontColor: '#FFFFFF',
      outlineColor: '#000000',
      fontFamily: 'Arial',
      fontWeight: 'bold'
    },
    movie: {
      height: 50,
      fontSize: 28,
      fontColor: '#FFFF00',
      outlineColor: '#000000',
      fontFamily: 'Arial',
      fontWeight: 'bold'
    },
    elegant: {
      height: 45,
      fontSize: 24,
      fontColor: '#FFFFFF',
      outlineColor: '#333333',
      fontFamily: 'Times New Roman',
      fontWeight: 'normal'
    },
    bold: {
      height: 60,
      fontSize: 32,
      fontColor: '#FF0000',
      outlineColor: '#000000',
      fontFamily: 'Arial',
      fontWeight: 'bold'
    }
  };

  // 加载保存的自定义主题
  useEffect(() => {
    const saved = localStorage.getItem('customThemes');
    if (saved) {
      try {
        setCustomThemes(JSON.parse(saved));
      } catch (e) {
        console.error('无法加载保存的主题:', e);
        localStorage.removeItem('customThemes');
      }
    }
  }, []);

  // 所有可用主题
  const allThemes = { ...defaultThemes, ...customThemes };

  // 处理图片上传
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setUploadedImage(img);
          updatePreview(img);
        };
        img.onerror = () => {
          alert('无法加载图片文件。');
          setUploadedImage(null);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        alert('读取文件时出错。');
        setUploadedImage(null);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedImage(null);
    }
  }, []);

  // 应用主题预设
  const applyTheme = useCallback((themeName: string) => {
    const theme = allThemes[themeName];
    if (theme) {
      setCaptionHeight(theme.height);
      setFontSize(theme.fontSize);
      setFontColor(theme.fontColor);
      setOutlineColor(theme.outlineColor);
      setFontFamily(theme.fontFamily);
      setFontWeight(theme.fontWeight);
      setActiveTheme(themeName);
    }
  }, [allThemes]);

  // 保存自定义主题
  const saveCustomTheme = useCallback(() => {
    if (!newThemeName.trim()) {
      alert('请输入主题名称');
      return;
    }

    const newTheme: Theme = {
      height: captionHeight,
      fontSize: fontSize,
      fontColor: fontColor,
      outlineColor: outlineColor,
      fontFamily: fontFamily,
      fontWeight: fontWeight
    };

    const updatedCustomThemes = { ...customThemes, [newThemeName]: newTheme };
    setCustomThemes(updatedCustomThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
    setNewThemeName('');
    alert('主题保存成功！');
  }, [newThemeName, captionHeight, fontSize, fontColor, outlineColor, fontFamily, fontWeight, customThemes]);

  // 更新预览
  const updatePreview = useCallback((img?: HTMLImageElement) => {
    const image = img || uploadedImage;
    if (!image) return;

    const captions = captionText.trim().split('\n').filter(line => line.trim() !== '');
    
    // 计算尺寸
    const padding = 10;
    const stripHeight = captionHeight + padding * 2;
    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    const totalHeight = originalHeight + captions.length * stripHeight;

    // 创建画布
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = originalWidth;
    canvas.height = totalHeight;

    // 绘制原始图片
    ctx.drawImage(image, 0, 0, originalWidth, originalHeight);

    // 定义字幕底部区域
    const sourceY = Math.max(0, originalHeight - stripHeight);

    // 绘制字幕
    captions.forEach((caption, index) => {
      const destinationY = originalHeight + index * stripHeight;

      // 绘制字幕背景
      try {
        ctx.drawImage(
          image,
          0,
          sourceY,
          originalWidth,
          Math.min(stripHeight, originalHeight - sourceY),
          0,
          destinationY,
          originalWidth,
          stripHeight
        );
      } catch (e) {
        console.error("绘制字幕背景出错:", e);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, destinationY, originalWidth, stripHeight);
      }

      // 设置文字样式
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 文字位置
      const textX = canvas.width / 2;
      const textY = destinationY + stripHeight / 2;

      // 绘制文字阴影/轮廓
      ctx.shadowColor = outlineColor;
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // 绘制文字
      ctx.fillStyle = fontColor;
      ctx.fillText(caption.trim(), textX, textY);

      // 重置阴影效果
      ctx.shadowColor = 'transparent';
    });

    // 添加水印
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('www.qunbaogao.com', canvas.width - 10, 10);

    // 更新预览和下载链接
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewImage(dataUrl);
    setDownloadUrl(dataUrl);
  }, [uploadedImage, captionText, captionHeight, fontSize, fontColor, outlineColor, fontFamily, fontWeight]);

  // 监听设置变化，自动更新预览
  useEffect(() => {
    if (uploadedImage) {
      updatePreview();
    }
  }, [updatePreview, uploadedImage]);

  // 生成最终图片
  const generateImage = useCallback(() => {
    if (!uploadedImage) {
      alert('请先选择一张图片');
      return;
    }

    const captions = captionText.trim().split('\n').filter(line => line.trim() !== '');
    if (captions.length === 0) {
      alert('请输入至少一行字幕');
      return;
    }

    updatePreview();
  }, [uploadedImage, captionText, updatePreview]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">图片字幕工具</h1>
        <p className="text-gray-600 mb-8">为您的图片添加专业的字幕条</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：上传图片和字幕内容 */}
        <div className="space-y-6">
          {/* 上传图片 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">上传图片</h2>
            <div>
              <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 mb-2">
                选择图片：
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2dc100] file:text-white hover:file:bg-[#249c00] transition-colors"
              />
            </div>
          </div>

          {/* 字幕内容 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">字幕内容</h2>
            <div>
              <label htmlFor="captionText" className="block text-sm font-medium text-gray-700 mb-2">
                输入字幕文本 (每行一条)：
              </label>
              <textarea
                id="captionText"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="在此输入字幕，每行对应一条字幕..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2dc100] focus:border-transparent resize-vertical"
              />
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generateImage}
            className="w-full bg-[#2dc100] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#249c00] transition-colors duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            生成图片
          </button>
        </div>

        {/* 中间：字幕设置 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">字幕设置</h2>

          {/* 主题预设 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">选择预设主题：</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(defaultThemes).map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => applyTheme(themeName)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTheme === themeName
                      ? 'bg-[#2dc100] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {themeName === 'default' ? '默认' : 
                   themeName === 'movie' ? '电影风格' :
                   themeName === 'elegant' ? '优雅文艺' :
                   themeName === 'bold' ? '醒目强调' : themeName}
                </button>
              ))}
              {Object.keys(customThemes).map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => applyTheme(themeName)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTheme === themeName
                      ? 'bg-[#2dc100] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          {/* 字幕高度和字体大小 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="captionHeight" className="block text-sm font-medium text-gray-700 mb-1">
                字幕高度(px)：
              </label>
              <input
                type="number"
                id="captionHeight"
                min="20"
                max="200"
                value={captionHeight}
                onChange={(e) => setCaptionHeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-1">
                字体大小(px)：
              </label>
              <input
                type="number"
                id="fontSize"
                min="12"
                max="100"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
              />
            </div>
          </div>

          {/* 字体颜色和轮廓颜色 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="fontColor" className="block text-sm font-medium text-gray-700 mb-1">
                字体颜色：
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="fontColor"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="outlineColor" className="block text-sm font-medium text-gray-700 mb-1">
                轮廓颜色：
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="outlineColor"
                  value={outlineColor}
                  onChange={(e) => setOutlineColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={outlineColor}
                  onChange={(e) => setOutlineColor(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 字体样式 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700 mb-1">
                字体：
              </label>
              <select
                id="fontFamily"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
              >
                <option value="system-ui">系统默认</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="SimSun">宋体</option>
                <option value="SimHei">黑体</option>
                <option value="Microsoft YaHei">微软雅黑</option>
                <option value="KaiTi">楷体</option>
              </select>
            </div>
            <div>
              <label htmlFor="fontWeight" className="block text-sm font-medium text-gray-700 mb-1">
                字体粗细：
              </label>
              <select
                id="fontWeight"
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
              >
                <option value="normal">正常</option>
                <option value="bold">粗体</option>
              </select>
            </div>
          </div>

          {/* 保存自定义主题 */}
          <div>
            <label htmlFor="newThemeName" className="block text-sm font-medium text-gray-700 mb-2">
              保存当前设置为新主题：
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="newThemeName"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="输入主题名称"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
              />
              <button
                onClick={saveCustomTheme}
                className="px-4 py-2 bg-[#2dc100] text-white rounded-md hover:bg-[#249c00] transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：预览区域 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">预览</h2>
          <div className="bg-gray-50 rounded-lg min-h-[400px] flex flex-col justify-center items-center">
            {previewImage ? (
              <img
                src={previewImage}
                alt="预览图片"
                className="max-w-full max-h-[500px] object-contain"
              />
            ) : (
              <div className="text-center text-gray-500">
                <i className="fas fa-image text-4xl mb-4"></i>
                <p>选择图片后将在此显示预览</p>
              </div>
            )}
          </div>
          
          {/* 下载按钮 */}
          {downloadUrl && (
            <div className="mt-4 text-center">
              <a
                href={downloadUrl}
                download="generated_image.png"
                className="inline-block bg-[#2dc100] text-white py-2 px-6 rounded-lg font-medium hover:bg-[#249c00] transition-colors duration-200"
              >
                下载图片
              </a>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 