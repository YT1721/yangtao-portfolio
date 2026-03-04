import { supabase, isSupabaseConfigured } from './supabase';
import { Project } from '../types';

// 重新导出 isSupabaseConfigured，方便 App.tsx 导入
export { isSupabaseConfigured };

const PERSONAL_INFO_KEY = 'personal_info';
const PROJECTS_KEY = 'projects';

interface PersonalInfo {
  name: string;
  engName: string;
  title: string;
  zhTitle: string;
  bio: string;
  fullBio: string;
  heroImageUrl: string;
  details: Record<string, string>;
  education: Array<{ school: string; degree: string; year: string }>;
  hobbies: string[];
  awards: string[];
}

// 从 Supabase 获取个人资料
export async function getPersonalInfo(): Promise<PersonalInfo | null> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using localStorage');
    const local = localStorage.getItem('yt_profile');
    return local ? JSON.parse(local) : null;
  }

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', PERSONAL_INFO_KEY)
    .single();

  if (error || !data) {
    console.log('No data from Supabase, checking localStorage');
    const local = localStorage.getItem('yt_profile');
    return local ? JSON.parse(local) : null;
  }

  return data.value as PersonalInfo;
}

// 保存个人资料到 Supabase
export async function savePersonalInfo(info: PersonalInfo): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, saved to localStorage only');
    try {
      localStorage.setItem('yt_profile', JSON.stringify(info));
    } catch (e) {
      console.error('localStorage quota exceeded');
    }
    return true;
  }

  const { error } = await supabase
    .from('settings')
    .upsert({ key: PERSONAL_INFO_KEY, value: info }, { onConflict: 'key' });

  if (error) {
    console.error('Error saving to Supabase:', error);
    return false;
  }

  return true;
}

// 从 Supabase 获取项目列表
export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, using localStorage');
    const local = localStorage.getItem('yt_projects');
    return local ? JSON.parse(local) : [];
  }

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', PROJECTS_KEY)
    .single();

  if (error || !data) {
    console.log('No data from Supabase, checking localStorage');
    const local = localStorage.getItem('yt_projects');
    return local ? JSON.parse(local) : [];
  }

  return data.value as Project[];
}

// 保存项目列表到 Supabase
export async function saveProjects(projects: Project[]): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, saved to localStorage only');
    try {
      localStorage.setItem('yt_projects', JSON.stringify(projects));
    } catch (e) {
      console.error('localStorage quota exceeded');
    }
    return true;
  }

  const { error } = await supabase
    .from('settings')
    .upsert({ key: PROJECTS_KEY, value: projects }, { onConflict: 'key' });

  if (error) {
    console.error('Error saving to Supabase:', error);
    return false;
  }

  return true;
}

// 压缩图片
async function compressImage(file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.7): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let { width, height } = img;
      
      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为 Base64 (JPEG 格式，质量 0.7)
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      console.log('Image compressed, original:', file.size, 'compressed length:', compressedBase64.length);
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      console.error('Failed to load image for compression');
      resolve(null);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// 上传图片到 Supabase Storage
export async function uploadImage(file: File, path: string): Promise<string | null> {
  console.log('Uploading image:', file.name, 'size:', (file.size / 1024).toFixed(2), 'KB');
  
  // 检查文件大小（5MB 限制）
  if (file.size > 5 * 1024 * 1024) {
    console.error('Image file too large. Max size is 5MB');
    alert('图片文件过大，请压缩至 5MB 以下');
    return null;
  }

  // 压缩图片并转换为 Base64
  console.log('Compressing image for reliable storage');
  const compressed = await compressImage(file, 1200, 1200, 0.7);
  
  if (!compressed) {
    console.error('Failed to compress image');
    return null;
  }
  
  // 如果压缩后还是太大 (> 500KB)，进一步压缩
  if (compressed.length > 500 * 1024) {
    console.log('Image still too large, compressing further...');
    return await compressImage(file, 800, 800, 0.5);
  }
  
  return compressed;
}

// 上传视频到 Supabase Storage
export async function uploadVideo(file: File): Promise<string | null> {
  console.log('Uploading video:', file.name, 'size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot upload video');
    return null;
  }

  // 检查文件大小（50MB 限制）
  if (file.size > 50 * 1024 * 1024) {
    console.error('Video file too large. Max size is 50MB');
    alert('视频文件过大，请压缩至 50MB 以下');
    return null;
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `videos/${fileName}`;

  console.log('Uploading video to Supabase:', filePath);
  
  const { error: uploadError } = await supabase.storage
    .from('portfolio')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading video:', uploadError);
    alert('视频上传失败: ' + uploadError.message);
    return null;
  }

  const { data } = supabase.storage.from('portfolio').getPublicUrl(filePath);
  console.log('Video uploaded successfully, URL:', data.publicUrl);
  return data.publicUrl;
}

// 删除视频
export async function deleteVideo(url: string): Promise<void> {
  if (!isSupabaseConfigured() || !url.includes('supabase')) {
    return;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf('portfolio');
    if (bucketIndex === -1) return;
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    await supabase.storage.from('portfolio').remove([filePath]);
    console.log('Video deleted:', filePath);
  } catch (e) {
    console.error('Error deleting video:', e);
  }
}

// 删除 Storage 中的图片
export async function deleteImage(url: string): Promise<void> {
  if (!isSupabaseConfigured() || url.startsWith('data:')) {
    return; // Base64 图片无需删除
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf('portfolio');
    if (bucketIndex === -1) return;
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    await supabase.storage.from('portfolio').remove([filePath]);
  } catch (e) {
    console.error('Error deleting image:', e);
  }
}
