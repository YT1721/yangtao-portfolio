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

// 上传图片 - 使用 Base64 编码（避免 CORS 问题）
export async function uploadImage(file: File, path: string): Promise<string | null> {
  console.log('Uploading image:', file.name, 'using Base64');
  
  // 始终使用 Base64 编码，避免 Supabase Storage 的 CORS 问题
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
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
