import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private widget?: any;
  private loadPromise?: Promise<any>;

  private ensureLoaded(): Promise<any> {
    if ((window as any).cloudinary?.createUploadWidget) {
      return Promise.resolve((window as any).cloudinary);
    }
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-cloudinary-widget]');
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).cloudinary));
        existing.addEventListener('error', () => reject(new Error('Cloudinary script error')));
        return;
      }

      const s = document.createElement('script');
      s.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      s.async = true;
      s.defer = true;
      s.setAttribute('data-cloudinary-widget', 'true');
      s.onload = () => resolve((window as any).cloudinary);
      s.onerror = () => reject(new Error('Cloudinary script error'));
      document.head.appendChild(s);
    });

    return this.loadPromise;
  }

  openUploadWidget(
    options: Partial<{
      folder: string;
      multiple: boolean;
      maxFiles: number;
      resourceType: 'image' | 'auto';
      tags: string[];
    }> = {},
    onSuccess: (info: any) => void
  ): void {
    const base = {
      cloudName: (environment as any).cloudinaryCloudName,
      uploadPreset: (environment as any).cloudinaryUploadPreset,
      sources: ['local', 'url', 'camera'],
      multiple: false,
      resourceType: 'image',
      cropping: false,
      showAdvancedOptions: false,
      maxImageFileSize: 5_000_000,
      folder: options.folder ?? 'markers',
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      ...options,
    };

    this.ensureLoaded()
      .then((cld) => {
        this.widget = cld.createUploadWidget(base, (error: any, result: any) => {
          if (result?.event === 'success') onSuccess(result.info);
        });
        this.widget?.open();
      })
      .catch(() => alert('Cloudinary no disponible ahora mismo.'));
  }
}
