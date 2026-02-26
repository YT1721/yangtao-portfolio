
export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  tags: string[];
  galleryImages?: string[]; // 新增：支持多图展示
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
