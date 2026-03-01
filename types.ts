
export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  tags: string[];
  galleryImages?: string[]; // 支持多图展示
  videoUrl?: string; // 视频链接（Bilibili/YouTube）
  videoPlatform?: 'bilibili' | 'youtube' | 'other'; // 视频平台类型
  localVideoUrl?: string; // 本地上传的视频文件URL
}

export interface Skill {
  name: string;
  description: string;
  icon: string;
  tags: string[];
}

export interface Experience {
  year: string;
  role: string;
  company: string;
  department?: string;
  level?: string;
  description?: string;
}
