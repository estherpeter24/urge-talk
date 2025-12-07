import { apiClient } from './client';
import { API_CONFIG } from '../../constants/config';

export interface MediaUploadResponse {
  id: string;
  file_url: string;
  thumbnail_url?: string;
  file_type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  file_size: number;
  file_name: string;
  mime_type: string;
  duration?: number;
  created_at: string;
}

class MediaService {
  async uploadMedia(
    file: any,
    onProgress?: (progress: number) => void
  ): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || file.name || 'upload.jpg',
    } as any);

    const response = await apiClient.upload<MediaUploadResponse>(
      '/media/upload',
      formData,
      onProgress
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Upload failed');
  }

  async deleteMedia(mediaId: string) {
    const response = await apiClient.delete(`/media/${mediaId}`);
    return response;
  }

  getMediaUrl(filename: string): string {
    const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
    return `${baseUrl}/api/media/${filename}`;
  }

  getThumbnailUrl(mediaId: string): string {
    const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
    return `${baseUrl}/api/media/${mediaId}/thumbnail`;
  }

  // Helper to extract filename from media URL
  extractFilename(url: string): string | null {
    const match = url.match(/\/media\/(.+)$/);
    return match ? match[1] : null;
  }

  // Check if file size is within limits
  isValidFileSize(fileSize: number, fileType: string): boolean {
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

    if (fileType.startsWith('image/')) {
      return fileSize <= MAX_IMAGE_SIZE;
    } else if (fileType.startsWith('video/')) {
      return fileSize <= MAX_VIDEO_SIZE;
    } else {
      return fileSize <= MAX_DOCUMENT_SIZE;
    }
  }
}

export const mediaService = new MediaService();
