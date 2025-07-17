import React, { useState, useRef } from 'react';
import { Upload, Download, Palette, Image as ImageIcon, Zap, Check, X, Plus, Trash2 } from 'lucide-react';
import { PhotoroomAPI } from './utils/photoroomAPI';

interface ProcessedImage {
  original: string;
  processed: string;
  filename: string;
}

interface BatchImage {
  id: string;
  original: string;
  processed?: string;
  filename: string;
  isProcessing: boolean;
  backgroundColor: string;
}
function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoroomAPI = useRef(new PhotoroomAPI('sk_pr_default_10dd528a0400cb6b67e26afa09c02b8dc38ac038'));
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [batchImages, setBatchImages] = useState<BatchImage[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      // Store the original file for API processing
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const processImageWithPhotoroom = async () => {
    if (!uploadedImage) return;
    
    setIsProcessing(true);
    setProcessingStep('Connecting to Photoroom API...');
    
    try {
      setProcessingStep('Uploading image for processing...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStep('AI is analyzing your image...');
      
      setProcessingStep('Removing background with professional AI...');
      const processedDataUrl = await photoroomAPI.current.removeBackgroundFromDataUrl(uploadedImage);
      
      setProcessingStep('Finalizing high-quality result...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessedImage({
        original: uploadedImage,
        processed: processedDataUrl,
        filename: `processed_${Date.now()}.png`
      });
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const downloadImage = (format: 'png' | 'jpg') => {
    if (!processedImage) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Fill background color for JPG
      if (format === 'jpg') {
        ctx!.fillStyle = backgroundColor;
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx!.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `background-removed.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, `image/${format}`, 0.9);
    };
    
    img.src = processedImage.processed;
  };

  const resetApp = () => {
    setUploadedImage(null);
    setOriginalFile(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setShowColorPicker(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                RemoveBG Pro
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Features</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Pricing</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">API</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Support</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Remove Image Backgrounds
            <span className="block text-purple-600">in Seconds</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional background removal powered by advanced AI. Upload any image and get pixel-perfect results instantly.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-purple-600" />
              Upload Image
            </h3>
            
            {!uploadedImage ? (
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600 mb-4">
                  Drag and drop your image here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Choose Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={resetApp}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {!processedImage && !isProcessing && (
                  <button
                    onClick={processImageWithPhotoroom}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Remove Background
                  </button>
                )}
                
                {isProcessing && (
                  <div className="w-full bg-gray-100 py-4 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                      <span className="font-medium">Processing with Photoroom AI...</span>
                    </div>
                    {processingStep && (
                      <div className="text-center text-sm text-gray-600">
                        {processingStep}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Check className="w-6 h-6 mr-2 text-green-600" />
              Result
            </h3>
            
            {processedImage ? (
              <div className="space-y-6">
                <div className="relative">
                  {/* Checkerboard pattern for transparency visualization */}
                  <div 
                    className="absolute inset-0 rounded-lg"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                      `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />
                  <img
                    src={processedImage.processed}
                    alt="Processed"
                    className="w-full h-64 object-cover rounded-lg relative z-10"
                  />
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium z-20 shadow-lg">
                    ✨ Photoroom AI
                  </div>
                </div>
                
                {/* Background Color Picker */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Background Color</label>
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Palette className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Change</span>
                    </button>
                  </div>
                  
                  {showColorPicker && (
                    <div className="flex space-x-2">
                      {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      />
                    </div>
                  )}
                </div>
                
                {/* Download Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => downloadImage('png')}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    PNG
                  </button>
                  <button
                    onClick={() => downloadImage('jpg')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    JPG
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Your processed image will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Batch Processing Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Plus className="w-6 h-6 mr-2 text-purple-600" />
            Batch Processing (Up to 10 images)
          </h3>
          
          {batchImages.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-gray-50 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600 mb-4">
                Select multiple images to process in batch (max 10)
              </p>
              <button
                onClick={() => batchFileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                Select Images
              </button>
              <input
                ref={batchFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleBatchFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Batch Controls */}
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  {batchImages.length} image{batchImages.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => batchFileInputRef.current?.click()}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add More
                  </button>
                  <button
                    onClick={resetBatch}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Clear All
                  </button>
                  {!isBatchProcessing && batchImages.some(img => !img.processed) && (
                    <button
                      onClick={processBatchImages}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Process All
                    </button>
                  )}
                </div>
                <input
                  ref={batchFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBatchFileSelect}
                  className="hidden"
                />
              </div>
              
              {/* Batch Images Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batchImages.map((image) => (
                  <div key={image.id} className="bg-gray-50 rounded-lg p-4 space-y-4">
                    {/* Image Preview */}
                    <div className="relative">
                      <img
                        src={image.processed || image.original}
                        alt={image.filename}
                        className="w-full h-32 object-cover rounded-lg"
                        style={image.processed ? { backgroundColor: image.backgroundColor } : {}}
                      />
                      <button
                        onClick={() => removeBatchImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {image.processed && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                          ✨ Processed
                        </div>
                      )}
                      {image.isProcessing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Filename */}
                    <p className="text-sm text-gray-600 truncate" title={image.filename}>
                      {image.filename}
                    </p>
                    
                    {/* Background Color Picker (only if processed) */}
                    {image.processed && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">Background Color</label>
                        <div className="flex space-x-1">
                          {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map((color) => (
                            <button
                              key={color}
                              onClick={() => updateBatchImageBackground(image.id, color)}
                              className={`w-6 h-6 rounded border-2 transition-colors ${
                                image.backgroundColor === color ? 'border-gray-400' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={image.backgroundColor}
                            onChange={(e) => updateBatchImageBackground(image.id, e.target.value)}
                            className="w-6 h-6 rounded border-2 border-gray-300"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Download Buttons (only if processed) */}
                    {image.processed && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => downloadBatchImage(image, 'png')}
                          className="bg-green-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          PNG
                        </button>
                        <button
                          onClick={() => downloadBatchImage(image, 'jpg')}
                          className="bg-blue-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          JPG
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Batch Processing Status */}
              {isBatchProcessing && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-3"></div>
                    <span className="font-medium text-purple-800">
                      Processing batch images with Photoroom AI...
                    </span>
                  </div>
                  <div className="mt-2 text-center text-sm text-purple-600">
                    {batchImages.filter(img => img.processed).length} of {batchImages.length} completed
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose RemoveBG Pro?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h4>
              <p className="text-gray-600">Process images in seconds with our custom AI model running locally.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Custom AI Model</h4>
              <p className="text-gray-600">Powered by Photoroom's professional AI for studio-quality results.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Professional Quality</h4>
              <p className="text-gray-600">Get studio-quality results with precise edge detection and hair detail preservation.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">RemoveBG Pro</h3>
              </div>
              <p className="text-gray-400">Professional background removal for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RemoveBG Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;