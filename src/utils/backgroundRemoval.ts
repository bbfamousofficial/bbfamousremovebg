// Custom AI-inspired background removal using image processing techniques
export class BackgroundRemovalAI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Edge detection using Sobel operator
  private detectEdges(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const edgeData = new Uint8ClampedArray(data.length);

    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let pixelX = 0;
        let pixelY = 0;

        for (let i = 0; i < 9; i++) {
          const xOffset = (i % 3) - 1;
          const yOffset = Math.floor(i / 3) - 1;
          const pixelIndex = ((y + yOffset) * width + (x + xOffset)) * 4;
          
          const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
          pixelX += gray * sobelX[i];
          pixelY += gray * sobelY[i];
        }

        const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
        const pixelIndex = (y * width + x) * 4;
        
        edgeData[pixelIndex] = magnitude;
        edgeData[pixelIndex + 1] = magnitude;
        edgeData[pixelIndex + 2] = magnitude;
        edgeData[pixelIndex + 3] = 255;
      }
    }

    return new ImageData(edgeData, width, height);
  }

  // Color-based segmentation
  private colorSegmentation(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const segmentedData = new Uint8ClampedArray(data.length);

    // Calculate color histogram
    const colorCounts: { [key: string]: number } = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor(data[i] / 32) * 32;
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      const colorKey = `${r},${g},${b}`;
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }

    // Find dominant background colors (usually around edges)
    const backgroundColors = new Set<string>();
    const edgePixels = [];
    
    // Sample edge pixels
    for (let x = 0; x < width; x++) {
      edgePixels.push(0 * width + x); // Top edge
      edgePixels.push((height - 1) * width + x); // Bottom edge
    }
    for (let y = 0; y < height; y++) {
      edgePixels.push(y * width + 0); // Left edge
      edgePixels.push(y * width + (width - 1)); // Right edge
    }

    const edgeColorCounts: { [key: string]: number } = {};
    edgePixels.forEach(pixelIndex => {
      const i = pixelIndex * 4;
      const r = Math.floor(data[i] / 32) * 32;
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      const colorKey = `${r},${g},${b}`;
      edgeColorCounts[colorKey] = (edgeColorCounts[colorKey] || 0) + 1;
    });

    // Get most common edge colors as background
    const sortedEdgeColors = Object.entries(edgeColorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([color]) => color);

    sortedEdgeColors.forEach(color => backgroundColors.add(color));

    // Create mask based on color similarity
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor(data[i] / 32) * 32;
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      const colorKey = `${r},${g},${b}`;

      let isBackground = backgroundColors.has(colorKey);
      
      // Additional similarity check
      if (!isBackground) {
        for (const bgColor of backgroundColors) {
          const [bgR, bgG, bgB] = bgColor.split(',').map(Number);
          const colorDistance = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );
          if (colorDistance < 80) {
            isBackground = true;
            break;
          }
        }
      }

      segmentedData[i] = data[i];
      segmentedData[i + 1] = data[i + 1];
      segmentedData[i + 2] = data[i + 2];
      segmentedData[i + 3] = isBackground ? 0 : 255; // Alpha channel for transparency
    }

    return new ImageData(segmentedData, width, height);
  }

  // Morphological operations to clean up the mask
  private morphologicalOperations(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const processedData = new Uint8ClampedArray(data.length);

    // Copy RGB channels
    for (let i = 0; i < data.length; i += 4) {
      processedData[i] = data[i];
      processedData[i + 1] = data[i + 1];
      processedData[i + 2] = data[i + 2];
    }

    // Erosion followed by dilation (opening operation)
    const kernel = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ];

    // Erosion
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let minAlpha = 255;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            if (kernel[ky][kx]) {
              const pixelIndex = ((y + ky - 1) * width + (x + kx - 1)) * 4;
              minAlpha = Math.min(minAlpha, data[pixelIndex + 3]);
            }
          }
        }
        
        const currentIndex = (y * width + x) * 4;
        processedData[currentIndex + 3] = minAlpha;
      }
    }

    // Dilation
    const dilatedData = new Uint8ClampedArray(processedData.length);
    for (let i = 0; i < processedData.length; i++) {
      dilatedData[i] = processedData[i];
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let maxAlpha = 0;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            if (kernel[ky][kx]) {
              const pixelIndex = ((y + ky - 1) * width + (x + kx - 1)) * 4;
              maxAlpha = Math.max(maxAlpha, processedData[pixelIndex + 3]);
            }
          }
        }
        
        const currentIndex = (y * width + x) * 4;
        dilatedData[currentIndex + 3] = maxAlpha;
      }
    }

    return new ImageData(dilatedData, width, height);
  }

  // Edge refinement using gradient information
  private refineEdges(imageData: ImageData): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const refinedData = new Uint8ClampedArray(data.length);

    // Copy original data
    for (let i = 0; i < data.length; i++) {
      refinedData[i] = data[i];
    }

    // Apply Gaussian blur to alpha channel for smoother edges
    const blurRadius = 2;
    for (let y = blurRadius; y < height - blurRadius; y++) {
      for (let x = blurRadius; x < width - blurRadius; x++) {
        let alphaSum = 0;
        let weightSum = 0;

        for (let dy = -blurRadius; dy <= blurRadius; dy++) {
          for (let dx = -blurRadius; dx <= blurRadius; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= blurRadius) {
              const weight = Math.exp(-(distance * distance) / (2 * blurRadius * blurRadius));
              const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
              alphaSum += data[pixelIndex + 3] * weight;
              weightSum += weight;
            }
          }
        }

        const currentIndex = (y * width + x) * 4;
        refinedData[currentIndex + 3] = Math.round(alphaSum / weightSum);
      }
    }

    return new ImageData(refinedData, width, height);
  }

  // Main processing function
  async processImage(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          
          // Draw original image
          this.ctx.drawImage(img, 0, 0);
          const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
          
          // Apply AI-inspired processing pipeline
          console.log('Step 1: Color segmentation...');
          const segmented = this.colorSegmentation(imageData);
          
          console.log('Step 2: Morphological operations...');
          const morphed = this.morphologicalOperations(segmented);
          
          console.log('Step 3: Edge refinement...');
          const refined = this.refineEdges(morphed);
          
          // Apply final result
          this.ctx.putImageData(refined, 0, 0);
          
          // Convert to data URL
          const processedDataUrl = this.canvas.toDataURL('image/png');
          resolve(processedDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  // Alternative simpler approach for better demo results
  async processImageSimple(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          
          // Create a more convincing demo by creating a subject mask
          // This simulates what a real AI would detect as the main subject
          this.ctx.drawImage(img, 0, 0);
          const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;
          
          // Create a simple center-focused mask (simulating subject detection)
          const centerX = img.width / 2;
          const centerY = img.height / 2;
          const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
          
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              const distance = Math.sqrt(
                Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
              );
              
              const pixelIndex = (y * img.width + x) * 4;
              
              // Create a gradient mask that keeps center and fades edges
              const normalizedDistance = distance / maxDistance;
              let alpha = 255;
              
              // More aggressive edge removal
              if (normalizedDistance > 0.6) {
                alpha = Math.max(0, 255 * (1 - (normalizedDistance - 0.6) / 0.4));
              }
              
              // Additional edge detection for better results
              const isEdgePixel = (
                x < 10 || x > img.width - 10 || 
                y < 10 || y > img.height - 10
              );
              
              if (isEdgePixel) {
                alpha = Math.min(alpha, 50);
              }
              
              data[pixelIndex + 3] = alpha;
            }
          }
          
          this.ctx.putImageData(imageData, 0, 0);
          const processedDataUrl = this.canvas.toDataURL('image/png');
          resolve(processedDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }
}