export class PhotoroomAPI {
  private apiKey: string;
  private baseUrl = 'https://sdk.photoroom.com/v1/segment';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async removeBackground(imageFile: File): Promise<string> {
    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('format', 'PNG');

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Photoroom API error: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Photoroom API error:', error);
      throw new Error('Failed to process image with Photoroom API');
    }
  }

  async removeBackgroundFromDataUrl(dataUrl: string): Promise<string> {
    // Convert data URL to File
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type });
    
    return this.removeBackground(file);
  }
}