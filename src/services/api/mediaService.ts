import { apiClient } from './client';
import { API_CONFIG, S3_CONFIG, MEDIA_CONFIG } from '../../constants/config';

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

export interface PresignedUrlResponse {
  upload_url: string;
  file_key: string;
  file_url: string;
  expires_in: number;
}

export type S3Folder = 'avatars' | 'media' | 'documents' | 'voice';

class MediaService {
  /**
   * Get a presigned URL from the backend for direct S3 upload
   */
  async getPresignedUrl(
    fileName: string,
    fileType: string,
    folder: S3Folder = 'media'
  ): Promise<PresignedUrlResponse> {
    const response = await apiClient.post<PresignedUrlResponse>('/media/presigned-url', {
      file_name: fileName,
      file_type: fileType,
      folder: folder,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get upload URL');
  }

  /**
   * Upload file directly to S3 using presigned URL
   */
  async uploadToS3(
    presignedUrl: string,
    file: { uri: string; type: string; name: string },
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Read the file as blob
        const response = await fetch(file.uri);
        const blob = await response.blob();

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('S3 upload network error'));
        xhr.ontimeout = () => reject(new Error('S3 upload timeout'));

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.timeout = 120000; // 2 minute timeout for large files
        xhr.send(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Complete the upload by notifying the backend (creates database record)
   */
  async completeUpload(
    fileKey: string,
    fileUrl: string,
    fileType: string,
    fileSize: number,
    fileName: string,
    duration?: number
  ): Promise<MediaUploadResponse> {
    const response = await apiClient.post<MediaUploadResponse>('/media/complete-upload', {
      file_key: fileKey,
      file_url: fileUrl,
      file_type: this.getFileCategory(fileType),
      file_size: fileSize,
      file_name: fileName,
      mime_type: fileType,
      duration: duration,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to complete upload');
  }

  /**
   * Main upload method - uses S3 presigned URL for direct upload
   */
  async uploadMedia(
    file: { uri: string; type?: string; fileName?: string; name?: string; fileSize?: number },
    onProgress?: (progress: number) => void,
    folder: S3Folder = 'media'
  ): Promise<MediaUploadResponse> {
    const fileName = file.fileName || file.name || `upload_${Date.now()}.jpg`;
    const fileType = file.type || 'image/jpeg';
    const fileSize = file.fileSize || 0;

    try {
      // Step 1: Get presigned URL from backend
      const presignedData = await this.getPresignedUrl(fileName, fileType, folder);

      // Step 2: Upload directly to S3
      await this.uploadToS3(
        presignedData.upload_url,
        { uri: file.uri, type: fileType, name: fileName },
        onProgress
      );

      // Step 3: Notify backend that upload is complete
      const result = await this.completeUpload(
        presignedData.file_key,
        presignedData.file_url,
        fileType,
        fileSize,
        fileName
      );

      return result;
    } catch (error: any) {
      // Fallback to direct server upload if S3 fails
      console.warn('S3 upload failed, falling back to server upload:', error.message);
      return this.uploadMediaToServer(file, onProgress);
    }
  }

  /**
   * Fallback: Upload media through the server (original method)
   */
  async uploadMediaToServer(
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

  /**
   * Helper method for uploading images (used by ProfileScreen, EditProfileScreen)
   */
  async uploadImage(
    imageUri: string,
    imageType: 'avatar' | 'media' = 'media'
  ): Promise<{ success: boolean; data?: { url: string }; message?: string }> {
    try {
      const folder: S3Folder = imageType === 'avatar' ? 'avatars' : 'media';
      const file = {
        uri: imageUri,
        type: 'image/jpeg',
        fileName: `${imageType}_${Date.now()}.jpg`,
      };

      const result = await this.uploadMedia(file, undefined, folder);
      return {
        success: true,
        data: { url: result.file_url },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to upload image',
      };
    }
  }

  /**
   * Upload voice message to S3
   */
  async uploadVoiceMessage(
    audioUri: string,
    duration: number,
    onProgress?: (progress: number) => void
  ): Promise<MediaUploadResponse> {
    const file = {
      uri: audioUri,
      type: 'audio/m4a',
      fileName: `voice_${Date.now()}.m4a`,
      fileSize: 0,
    };

    try {
      // Get presigned URL
      const presignedData = await this.getPresignedUrl(file.fileName!, file.type, 'voice');

      // Upload to S3
      await this.uploadToS3(presignedData.upload_url, file as any, onProgress);

      // Complete upload with duration
      const result = await this.completeUpload(
        presignedData.file_key,
        presignedData.file_url,
        file.type,
        0,
        file.fileName!,
        duration
      );

      return result;
    } catch (error) {
      // Fallback to server upload
      console.warn('S3 voice upload failed, using server upload');
      return this.uploadMediaToServer({ ...file, duration }, onProgress);
    }
  }

  /**
   * Get the CDN URL for a media file
   */
  getMediaUrl(fileKey: string): string {
    // If it's already a full URL, return as-is
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      return fileKey;
    }
    // Otherwise, construct CDN URL
    return `${S3_CONFIG.CDN_URL}/${fileKey}`;
  }

  getThumbnailUrl(mediaId: string): string {
    const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
    return `${baseUrl}/api/media/${mediaId}/thumbnail`;
  }

  /**
   * Helper to extract file key from S3 URL
   */
  extractFileKey(url: string): string | null {
    // Extract key from S3 URL or CDN URL
    const cdnMatch = url.match(new RegExp(`${S3_CONFIG.CDN_URL}/(.+)$`));
    if (cdnMatch) return cdnMatch[1];

    const s3Match = url.match(/\.s3\.[^/]+\.amazonaws\.com\/(.+)$/);
    if (s3Match) return s3Match[1];

    // Legacy: extract from API media URL
    const apiMatch = url.match(/\/media\/(.+)$/);
    return apiMatch ? apiMatch[1] : null;
  }

  /**
   * Determine file category from MIME type
   */
  private getFileCategory(mimeType: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }

  /**
   * Check if file size is within limits
   */
  isValidFileSize(fileSize: number, fileType: string): boolean {
    if (fileType.startsWith('image/')) {
      return fileSize <= MEDIA_CONFIG.MAX_IMAGE_SIZE;
    } else if (fileType.startsWith('video/')) {
      return fileSize <= MEDIA_CONFIG.MAX_VIDEO_SIZE;
    } else {
      return fileSize <= MEDIA_CONFIG.MAX_DOCUMENT_SIZE;
    }
  }

  /**
   * Check if file format is supported
   */
  isValidFileFormat(fileName: string, fileType: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return false;

    if (fileType.startsWith('image/')) {
      return MEDIA_CONFIG.SUPPORTED_IMAGE_FORMATS.includes(extension);
    } else if (fileType.startsWith('video/')) {
      return MEDIA_CONFIG.SUPPORTED_VIDEO_FORMATS.includes(extension);
    } else {
      return MEDIA_CONFIG.SUPPORTED_DOCUMENT_FORMATS.includes(extension);
    }
  }
}

export const mediaService = new MediaService();
