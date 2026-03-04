import React, { useState, useEffect, useRef } from 'react';
import { 
  PERSONAL_INFO as DEFAULT_INFO, 
  AI_SKILLS as DEFAULT_AI_SKILLS, 
  TRADITIONAL_SKILLS as DEFAULT_TRAD_SKILLS, 
  PROJECTS as DEFAULT_PROJECTS, 
  EXPERIENCE as DEFAULT_EXPERIENCE,
  EDUCATION as DEFAULT_EDUCATION,
  ABILITY_SCORES as DEFAULT_SCORES,
  MANAGEMENT_SCORES as DEFAULT_MANAGEMENT,
  SOFTWARE_SKILLS as DEFAULT_SOFTWARE,
  CUSTOMER_LOGOS as DEFAULT_CUSTOMERS
} from './constants';
import { Project } from './types';
import { getPersonalInfo, getProjects, savePersonalInfo, saveProjects, uploadImage, uploadVideo, deleteImage, deleteVideo, isSupabaseConfigured } from './lib/database';

const ADMIN_PASSWORD = "yangtao666"; 

const App: React.FC = () => {
  const [personalInfo, setPersonalInfo] = useState(DEFAULT_INFO);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'detail'>('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [activeAdminTab, setActiveAdminTab] = useState<'profile' | 'projects' | 'system'>('profile');
  const [activeTab, setActiveTab] = useState<'全部' | 'AI 视频' | '设计项目' | '品牌设计'>('全部');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // 从数据库加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [info, projs] = await Promise.all([
          getPersonalInfo(),
          getProjects()
        ]);
        
        if (info) setPersonalInfo(info);
        if (projs && projs.length > 0) setProjects(projs);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    const authStatus = sessionStorage.getItem('yt_is_auth');
    if (authStatus === 'true') setIsAuthenticated(true);
  }, []);

  // 手动保存函数
  const handleManualSave = async () => {
    setSaveStatus('saving');
    try {
      const [infoSaved, projectsSaved] = await Promise.all([
        savePersonalInfo(personalInfo),
        saveProjects(projects)
      ]);
      
      if (infoSaved && projectsSaved) {
        setSaveStatus('saved');
        alert('保存成功！数据已同步到云端。');
      } else {
        setSaveStatus('error');
        alert('保存失败，请检查网络连接后重试。');
      }
    } catch (error) {
      console.error('Manual save error:', error);
      setSaveStatus('error');
      alert('保存出错: ' + (error as Error).message);
    } finally {
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // 自动保存到数据库（延迟 3 秒，避免频繁保存）
  useEffect(() => {
    if (isLoading) return;
    
    const timeoutId = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await Promise.all([
          savePersonalInfo(personalInfo),
          saveProjects(projects)
        ]);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto save error:', error);
        setSaveStatus('error');
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [personalInfo, projects, isLoading]);

  const handleAuth = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('yt_is_auth', 'true');
      setIsAuthModalOpen(false);
      setIsAdminOpen(true);
      setPasswordInput("");
    } else {
      alert("口令错误。");
      setPasswordInput("");
    }
  };

  const handleAdminClick = () => {
    if (isAuthenticated) setIsAdminOpen(true);
    else setIsAuthModalOpen(true);
  };

  const handleSaveToLocal = async () => {
    setSaveStatus('saving');
    try {
      await Promise.all([
        savePersonalInfo(personalInfo),
        saveProjects(projects)
      ]);
      setSaveStatus('saved');
      alert('已保存到云端！');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
      alert('保存失败，请重试。');
    }
  };

  const generateFullCode = () => {
    return `import { Project, Skill, Experience } from './types';

export const PERSONAL_INFO = ${JSON.stringify(personalInfo, null, 2)};

export const ABILITY_SCORES = ${JSON.stringify(DEFAULT_SCORES, null, 2)};

export const SOFTWARE_SKILLS = ${JSON.stringify(DEFAULT_SOFTWARE, null, 2)};

export const PROJECTS: Project[] = ${JSON.stringify(projects, null, 2)};

export const EXPERIENCE: Experience[] = ${JSON.stringify(DEFAULT_EXPERIENCE, null, 2)};

export const AI_SKILLS: Skill[] = ${JSON.stringify(DEFAULT_AI_SKILLS, null, 2)};

export const TRADITIONAL_SKILLS: Skill[] = ${JSON.stringify(DEFAULT_TRAD_SKILLS, null, 2)};

export const CUSTOMER_LOGOS = ${JSON.stringify(["安踏", "雀巢", "立白", "牛茶", "松果健康", "华宇信息", "东道", "亿赞普", "首发集团", "中国人民大学", "山东大学", "孔子学院", "国元证券", "金鹿公务机", "阿克苏诺贝尔"], null, 2)};`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateFullCode()).then(() => alert('代码已复制到剪贴板！'));
  };

  const filteredProjects = projects.filter(p => {
    if (activeTab === '全部') return true;
    if (activeTab === 'AI 视频') return p.category.includes('AI');
    if (activeTab === '设计项目') return p.category.includes('设计') || p.category.includes('UI');
    if (activeTab === '品牌设计') return p.category.includes('品牌') || p.category.includes('包装');
    return true;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'project' | 'gallery', projectId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const path = type === 'hero' ? 'hero' : `projects/${projectId || 'temp'}`;
    const imageUrl = await uploadImage(file, path);
    
    if (imageUrl) {
      if (type === 'hero') {
        // 删除旧图片
        if (personalInfo.heroImageUrl && !personalInfo.heroImageUrl.startsWith('data:')) {
          await deleteImage(personalInfo.heroImageUrl);
        }
        setPersonalInfo({ ...personalInfo, heroImageUrl: imageUrl });
      } else if (type === 'project' && projectId) {
        const project = projects.find(p => p.id === projectId);
        if (project?.imageUrl && !project.imageUrl.startsWith('data:')) {
          await deleteImage(project.imageUrl);
        }
        setProjects(projects.map(p => p.id === projectId ? { ...p, imageUrl: imageUrl } : p));
      } else if (type === 'gallery' && projectId) {
        setProjects(projects.map(p => p.id === projectId ? { ...p, galleryImages: [...(p.galleryImages || []), imageUrl] } : p));
      }
    }
  };

  const handleDeleteGalleryImage = async (projectId: string, imageUrl: string, imageIndex: number) => {
    await deleteImage(imageUrl);
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newGallery = [...(p.galleryImages || [])];
        newGallery.splice(imageIndex, 1);
        return { ...p, galleryImages: newGallery };
      }
      return p;
    }));
  };

  // 处理视频上传
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('video/')) {
      alert('请选择视频文件');
      return;
    }

    // 上传视频
    const videoUrl = await uploadVideo(file);
    
    if (videoUrl) {
      // 删除旧视频
      const project = projects.find(p => p.id === projectId);
      if (project?.localVideoUrl) {
        await deleteVideo(project.localVideoUrl);
      }
      setProjects(projects.map(p => p.id === projectId ? { ...p, localVideoUrl: videoUrl } : p));
    }
  };

  // 删除视频
  const handleDeleteVideo = async (projectId: string, videoUrl: string) => {
    await deleteVideo(videoUrl);
    setProjects(projects.map(p => p.id === projectId ? { ...p, localVideoUrl: undefined } : p));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'detail' && selectedProject) {
    return (
      <div className="min-h-screen bg-background-dark text-white animate-fade-in">
        <nav className="fixed top-0 w-full z-50 glass-effect h-20 px-6 md:px-12 flex items-center justify-between">
          <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-primary transition-all">
            <span className="material-symbols-outlined text-sm">arrow_back</span> 返回
          </button>
          <div className="text-[10px] font-black uppercase tracking-tighter text-slate-600">{selectedProject.title}</div>
        </nav>
        <main className="pt-32 pb-20 px-6 md:px-12 max-w-5xl mx-auto text-center md:text-left">
          <div className="mb-16">
            <div className="text-primary text-[10px] font-bold uppercase tracking-[0.5em] mb-4">{selectedProject.category}</div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-none">{selectedProject.title}</h1>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto md:mx-0 mb-20">{selectedProject.description}</p>
            <img src={selectedProject.imageUrl} className="w-full rounded-[2.5rem] shadow-2xl border border-white/5 mb-10" alt="Main" />
            
            {/* 本地视频播放区域 */}
            {selectedProject.localVideoUrl && (
              <div className="w-full rounded-[2.5rem] overflow-hidden border border-white/5 mb-10 bg-black/50">
                <div className="relative aspect-video">
                  <video 
                    src={selectedProject.localVideoUrl}
                    controls
                    className="w-full h-full"
                    poster={selectedProject.imageUrl}
                  />
                </div>
              </div>
            )}
            
            {/* 外部视频播放区域 */}
            {selectedProject.videoUrl && !selectedProject.localVideoUrl && (
              <div className="w-full rounded-[2.5rem] overflow-hidden border border-white/5 mb-10 bg-black/50">
                {selectedProject.videoPlatform === 'bilibili' ? (
                  <div className="relative aspect-video">
                    <iframe 
                      src={selectedProject.videoUrl.includes('player.bilibili.com') 
                        ? selectedProject.videoUrl 
                        : `//player.bilibili.com/player.html?bvid=${selectedProject.videoUrl.match(/BV[a-zA-Z0-9]+/)?.[0] || ''}&page=1&high_quality=1&danmaku=0`}
                      className="w-full h-full"
                      allowFullScreen
                      scrolling="no"
                      frameBorder="0"
                      sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
                    />
                  </div>
                ) : selectedProject.videoPlatform === 'youtube' ? (
                  <div className="relative aspect-video">
                    <iframe 
                      src={selectedProject.videoUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full"
                      allowFullScreen
                      frameBorder="0"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video flex items-center justify-center bg-surface-dark">
                    <a href={selectedProject.videoUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-4 text-primary hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-6xl">play_circle</span>
                      <span className="text-sm font-medium">点击播放视频</span>
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {selectedProject.galleryImages?.map((img, i) => (
              <img 
                key={i} 
                src={img} 
                className="w-full rounded-[2.5rem] shadow-2xl border border-white/5 mb-10" 
                alt={`Gallery ${i}`}
                onError={(e) => {
                  console.error('Gallery image failed to load:', img);
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/><text x="50" y="50" font-size="40" fill="%23666" text-anchor="middle" dy=".3em">?</text></svg>';
                }}
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white selection:bg-primary/30 scroll-smooth">
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col lg:flex-row items-center pt-10 overflow-hidden">
          <div className="flex-1 px-6 md:px-12 py-20 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-10">
              <span className="material-symbols-outlined text-sm">verified</span> {personalInfo.zhTitle}
            </div>
            <h1 className="text-7xl md:text-[10rem] font-bold tracking-tighter leading-[0.8] mb-12 uppercase flex flex-col">
              <span className="flex items-baseline gap-4">
                <span>{personalInfo.engName.split(' ')[0]}</span>
                <span className="text-2xl md:text-4xl font-black text-white/50 tracking-tighter lowercase">{personalInfo.name}</span>
              </span>
              <span className="text-gradient">{personalInfo.engName.split(' ')[1]}</span>
            </h1>
            <p className="max-w-xl text-xl text-slate-400 font-light leading-relaxed mb-12">{personalInfo.bio}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 border-t border-white/5 pt-12">
              {Object.entries(personalInfo.details).map(([key, value]) => (
                <div key={key}>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2">{key}</div>
                  <div className="text-lg font-bold">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full h-full relative min-h-[600px] lg:min-h-screen group">
             <div className="absolute inset-0 bg-gradient-to-tr from-background-dark via-transparent to-transparent z-10"></div>
             <img 
               src={personalInfo.heroImageUrl} 
               className="absolute inset-0 w-full h-full object-cover opacity-90 transition-all duration-1000 grayscale hover:grayscale-0 scale-105 group-hover:scale-100"
               onError={(e) => {
                 console.error('Hero image failed to load:', personalInfo.heroImageUrl);
                 (e.target as HTMLImageElement).style.display = 'none';
               }}
             />
             <div className="absolute bottom-20 right-10 z-20 text-right">
                <div className="text-sm font-black uppercase tracking-[0.4em] mb-4 text-primary drop-shadow-[0_0_10px_rgba(55,19,236,0.8)]">PORTFOLIO EDITION</div>
                <div className="flex flex-col items-end">
                   <div className="text-6xl md:text-8xl font-black italic uppercase text-white leading-[0.85] tracking-tighter">CRAFT</div>
                   <div className="text-4xl md:text-7xl font-black italic uppercase text-white flex items-center gap-4 tracking-tighter"><span className="text-primary">&</span> AI FUTURE</div>
                </div>
                <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 italic">匠心筑梦 · AI 驱动未来</div>
             </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-40 bg-surface-dark relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="flex flex-col lg:flex-row gap-24">
              <div className="lg:w-[40%]">
                <div className="relative inline-block">
                  <div className="text-[14rem] font-black text-white/5 leading-none tracking-tighter select-none">18<span className="text-primary">+</span></div>
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 pt-10">
                    <h2 className="text-5xl md:text-6xl font-black italic uppercase leading-tight tracking-tighter">CORE<br/><span className="text-primary italic">EXPERTISE</span></h2>
                  </div>
                </div>
              </div>
              <div className="lg:w-[60%] space-y-12">
                 <p className="text-2xl md:text-4xl font-light leading-snug tracking-tight text-white/90">
                    拥有 <span className="font-black italic border-b-2 border-primary/40">18 年+</span> 设计行业全领域深耕经验，兼具"传统设计功底 + <span className="text-primary font-bold italic">AI 技术落地</span> + 全流程项目把控"的复合型核心优势。
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                       <div className="text-primary font-black text-[10px] uppercase tracking-[0.4em] mb-4">2023 AIGC 聚焦</div>
                       <p className="text-slate-400 text-sm leading-relaxed">精通生图模型部署、Lora 训练等核心技能，实现创意生产效率的指数级提升。</p>
                    </div>
                    <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                       <div className="text-primary font-black text-[10px] uppercase tracking-[0.4em] mb-4">2025 AI 视频创作</div>
                       <p className="text-slate-400 text-sm leading-relaxed">转型 AI 漫剧与商业视频创作，掌握编剧-导演-分镜-美术-剪辑全流程。已实现商业化落地。</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 服务过的客户 */}
        <section className="py-24 bg-surface-dark relative border-y border-white/5">
           <div className="max-w-7xl mx-auto px-6 md:px-12">
              <div className="flex items-center gap-3 mb-12">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-blue-400">business</span>
                 </div>
                 <h2 className="text-2xl font-bold">服务过的客户</h2>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                 {DEFAULT_CUSTOMERS.map((customer, i) => (
                    <div 
                       key={i} 
                       className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-3 hover:border-blue-500/30 hover:bg-white/[0.08] transition-all group cursor-default"
                       title={customer}
                    >
                       <span className="text-[10px] font-medium text-slate-400 text-center leading-tight group-hover:text-white transition-colors line-clamp-2">
                          {customer}
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 个人能力 - 三列布局 */}
        <section className="py-40 bg-background-dark relative border-y border-white/5">
           <div className="max-w-7xl mx-auto px-6 md:px-12">
              <h2 className="text-4xl font-bold mb-16">个人能力</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                 
                 {/* 左侧：综合素质能力 */}
                 <div className="space-y-8">
                    <h3 className="text-xl font-bold text-white/80 mb-8">综合素质能力</h3>
                    <div className="space-y-6">
                       {DEFAULT_SCORES.map((skill, i) => (
                          <div key={i} className="group">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-white/80">{skill.name}</span>
                             </div>
                             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-400 rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${skill.score}%` }}
                                ></div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* 中间：知识储备 */}
                 <div className="space-y-8">
                    <h3 className="text-xl font-bold text-white/80 mb-8">知识储备</h3>
                    <div className="space-y-6">
                       {DEFAULT_MANAGEMENT.map((skill, i) => (
                          <div key={i} className="group">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-white/80">{skill.name}</span>
                             </div>
                             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-400 rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${skill.score}%` }}
                                ></div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* 右侧：软件应用能力 */}
                 <div className="space-y-8">
                    <h3 className="text-xl font-bold text-white/80 mb-8">软件应用能力</h3>
                    <div className="space-y-5">
                       {DEFAULT_SOFTWARE.map((sw, i) => {
                          // 软件图标映射 - 取前3个字母
                          const getSoftwareIcon = (name: string) => {
                             const icons: Record<string, string> = {
                                "Illustrator": "Ill",
                                "Photoshop": "Pho",
                                "Figma": "Fig",
                                "Sketch": "Ske",
                                "MasterGo": "Mas",
                                "Midjourney": "Mid",
                                "Stable Diffusion": "Sta",
                                "ComfyUI": "Com",
                                "Cinema 4D": "Cin",
                                "Indesign": "Ind",
                                "剪映": "剪映",
                                "Procreate": "Pro"
                             };
                             return icons[name] || name.substring(0, 3);
                          };
                          
                          return (
                             <div key={i} className="group">
                                <div className="flex items-center gap-3 mb-2">
                                   <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400">
                                      {getSoftwareIcon(sw.name)}
                                   </div>
                                   <span className="text-sm font-medium text-white/80">{sw.name}</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden ml-10">
                                   <div 
                                     className="h-full bg-blue-400 rounded-full transition-all duration-1000 ease-out"
                                     style={{ width: `${sw.score}%` }}
                                   ></div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>

              </div>
           </div>
        </section>

        {/* 教育经历 & 工作经历 */}
        <section className="py-24 bg-surface-dark relative border-y border-white/5">
           <div className="max-w-7xl mx-auto px-6 md:px-12">
              
              {/* 教育经历 - 紧凑时间轴 */}
              <div className="mb-20">
                  <div className="flex items-center gap-3 mb-10">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl text-primary">school</span>
                     </div>
                     <h2 className="text-2xl font-bold">教育经历</h2>
                  </div>
                  
                  <div className="relative">
                     {/* 时间轴线 */}
                     <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/30 to-transparent hidden md:block"></div>
                     
                     <div className="space-y-4">
                        {DEFAULT_EDUCATION.map((edu, i) => (
                           <div key={i} className="relative flex flex-col md:flex-row gap-4 md:gap-8 group">
                              {/* 时间节点 */}
                              <div className="flex items-center gap-3 md:w-36 shrink-0">
                                 <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
                                    <span className="text-sm font-bold text-white">{edu.degree.includes('大专') ? '专' : edu.degree.substring(0, 1)}</span>
                                 </div>
                                 <span className="text-xs text-slate-500 md:hidden">{edu.period}</span>
                              </div>
                              
                              {/* 内容卡片 */}
                              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-primary/30 hover:bg-white/[0.04] transition-all">
                                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                    <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">{edu.school}</h3>
                                    <span className="text-xs text-slate-500 hidden md:block">{edu.period}</span>
                                 </div>
                                 <p className="text-sm text-slate-400">{edu.major}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
              </div>

              {/* 工作经历 - 紧凑时间轴 */}
              <div>
                  <div className="flex items-center gap-3 mb-10">
                     <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl text-blue-400">work</span>
                     </div>
                     <h2 className="text-2xl font-bold">工作经历</h2>
                  </div>
                  
                  <div className="relative">
                     {/* 时间轴线 */}
                     <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-blue-500/30 to-transparent hidden md:block"></div>
                     
                     <div className="space-y-4">
                        {DEFAULT_EXPERIENCE.map((exp, i) => (
                           <div key={i} className="relative flex flex-col md:flex-row gap-4 md:gap-8 group">
                              {/* 时间节点 */}
                              <div className="flex items-center gap-3 md:w-36 shrink-0">
                                 <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all">
                                    <span className="text-[10px] text-slate-400">{exp.year.split('-')[0].slice(2)}</span>
                                 </div>
                                 <span className="text-xs text-slate-500 md:hidden">{exp.year}</span>
                              </div>
                              
                              {/* 内容卡片 */}
                              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all">
                                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                       <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{exp.company}</h3>
                                       {exp.level && (
                                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                                             {exp.level}
                                          </span>
                                       )}
                                    </div>
                                    <span className="text-xs text-slate-500 hidden md:block">{exp.year}</span>
                                 </div>
                                 <p className="text-sm text-slate-400">{exp.role} · {exp.department}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
              </div>

           </div>
        </section>

        {/* Works Section */}
        <section id="works" className="py-40 bg-background-dark">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-28">
              <div className="max-w-xl text-left">
                <h2 className="text-7xl md:text-9xl font-black italic uppercase leading-[0.75] tracking-tighter text-white mb-6">SELECTED<br/>WORKS</h2>
                <div className="flex items-center gap-4"><div className="h-[2px] w-12 bg-primary"></div><p className="text-primary text-sm font-black uppercase tracking-[0.4em]">精选作品展示 / PORTFOLIO</p></div>
              </div>
              <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-4">
                {(['全部', 'AI 视频', '设计项目', '品牌设计'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-[10px] font-bold uppercase rounded-xl transition-all ${activeTab === tab ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>{tab}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredProjects.map((project) => (
                <div key={project.id} onClick={() => { setSelectedProjectId(project.id); setCurrentView('detail'); window.scrollTo(0,0); }} className="group relative rounded-[3rem] overflow-hidden bg-surface-dark border border-white/5 h-[600px] cursor-pointer">
                  <img 
                    src={project.imageUrl} 
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" 
                    alt={project.title}
                    onError={(e) => {
                      console.error('Project image failed to load:', project.imageUrl);
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/><text x="50" y="50" font-size="20" fill="%23666" text-anchor="middle" dy=".3em">No Image</text></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-12 transform translate-y-8 group-hover:translate-y-0 transition-all duration-700">
                    <span className="px-3 py-1.5 bg-primary/20 backdrop-blur-md text-primary text-[9px] font-black uppercase rounded-lg mb-6 inline-block tracking-widest border border-primary/30 italic">{project.category}</span>
                    <h3 className="text-4xl font-black text-white mb-3 uppercase group-hover:text-primary transition-colors tracking-tighter italic">{project.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-500 font-light">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-background-dark border-t border-white/5 py-32 text-center">
           <div className="text-[10px] uppercase tracking-[1em] font-black text-slate-800 italic">Yang Tao Creative & AI Labs © 2026</div>
        </footer>
      </main>

      {/* Admin Controls */}
      <button onClick={handleAdminClick} className="fixed bottom-10 right-10 size-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-slate-700 hover:text-primary transition-all z-[100] opacity-10 hover:opacity-100">
        <span className="material-symbols-outlined text-sm">settings</span>
      </button>

      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div className={`fixed bottom-10 left-10 px-4 py-2 rounded-full text-[10px] font-bold uppercase z-[9999] transition-all shadow-lg ${
          saveStatus === 'saving' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          saveStatus === 'saved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '保存失败'}
        </div>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl">
          <div className="w-full max-w-sm glass-effect p-12 rounded-[3rem] border border-white/10 flex flex-col items-center gap-10 animate-fade-in-up">
            <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20"><span className="material-symbols-outlined text-4xl">lock</span></div>
            <input type="password" placeholder="••••••••" autoFocus value={passwordInput} onChange={e => setPasswordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center tracking-[1em] focus:border-primary outline-none" />
            <button onClick={handleAuth} className="w-full py-5 bg-primary rounded-2xl text-[10px] font-black uppercase shadow-xl">确认身份</button>
            <button onClick={() => setIsAuthModalOpen(false)} className="text-[10px] font-bold uppercase text-slate-700">取消</button>
          </div>
        </div>
      )}

      {isAdminOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-lg">
          <div className="w-full max-w-6xl h-[88vh] bg-surface-dark border border-white/10 rounded-[4rem] overflow-hidden flex flex-col animate-fade-in-up shadow-2xl">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">创意中心后台 <span className="text-primary text-[10px] font-black px-2 py-0.5 bg-primary/10 rounded ml-4">PRO</span></h2>
                {isSupabaseConfigured() && (
                  <span className="text-[10px] font-bold uppercase px-2 py-1 bg-green-500/20 text-green-400 rounded">云端已连接</span>
                )}
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="size-12 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-64 border-r border-white/5 p-10 flex flex-col gap-6 bg-black/20">
                <button onClick={() => setActiveAdminTab('profile')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all ${activeAdminTab === 'profile' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500'}`}>资料设置</button>
                <button onClick={() => setActiveAdminTab('projects')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all ${activeAdminTab === 'projects' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500'}`}>项目库</button>
                <button onClick={() => setActiveAdminTab('system')} className={`mt-auto px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all ${activeAdminTab === 'system' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-indigo-500'}`}>部署与导出</button>
              </div>
              <div className="flex-1 p-16 overflow-y-auto custom-scrollbar">
                {activeAdminTab === 'profile' && (
                  <div className="space-y-12">
                     <div className="flex gap-16 items-start">
                        <div className="relative group size-80 shrink-0 cursor-pointer overflow-hidden rounded-[4rem] border-2 border-dashed border-white/10 hover:border-primary transition-all">
                           {console.log('Hero image URL:', personalInfo.heroImageUrl)}
                           <img 
                             src={personalInfo.heroImageUrl} 
                             className="w-full h-full object-cover" 
                             onError={(e) => {
                               console.error('Hero image failed to load:', personalInfo.heroImageUrl);
                               (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/><text x="50" y="50" font-size="40" fill="%23666" text-anchor="middle" dy=".3em">?</text></svg>';
                             }} 
                           />
                           <div onClick={() => heroInputRef.current?.click()} className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-4xl text-primary mb-4">photo_camera</span>
                              <span className="text-[10px] font-black uppercase">更换形象照片</span>
                           </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-10 text-left">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase text-slate-500">中文姓名</label>
                              <input value={personalInfo.name} onChange={e => setPersonalInfo({...personalInfo, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-primary outline-none" />
                           </div>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase text-slate-500">英文姓名</label>
                              <input value={personalInfo.engName} onChange={e => setPersonalInfo({...personalInfo, engName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-primary outline-none" />
                           </div>
                           <div className="col-span-2 space-y-4">
                              <label className="text-[10px] font-black uppercase text-slate-500">关于我 / BIO</label>
                              <textarea value={personalInfo.bio} onChange={e => setPersonalInfo({...personalInfo, bio: e.target.value})} rows={5} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 focus:border-primary outline-none resize-none" />
                           </div>
                        </div>
                     </div>
                  </div>
                )}
                {activeAdminTab === 'projects' && (
                  <div className="space-y-10">
                    <div className="flex justify-between items-center mb-10">
                       <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">项目列表 ({projects.length})</h3>
                       <button onClick={() => setProjects([{ id: Date.now().toString(), title: '新作品', category: 'AI 视频', description: '描述...', imageUrl: 'https://picsum.photos/1200/800', tags: [], galleryImages: [] }, ...projects])} className="px-10 py-5 bg-primary rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-primary/20">+ 发布新项目</button>
                    </div>
                    {projects.map((p, idx) => (
                      <div key={p.id} className="p-12 bg-white/[0.02] border border-white/5 rounded-[3.5rem] space-y-8 text-left">
                        <div className="flex gap-12">
                           <div className="relative group size-64 shrink-0 rounded-[2.5rem] overflow-hidden">
                              <img src={p.imageUrl} className="w-full h-full object-cover" />
                              <div onClick={() => { setEditingProjectId(p.id); fileInputRef.current?.click(); }} className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-black uppercase">修改封面</div>
                           </div>
                           <div className="flex-1 grid grid-cols-2 gap-8">
                              <input value={p.title} onChange={e => { const n = [...projects]; n[idx].title = e.target.value; setProjects(n); }} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary outline-none font-bold" placeholder="作品标题" />
                              <select value={p.category} onChange={e => { const n = [...projects]; n[idx].category = e.target.value; setProjects(n); }} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-primary outline-none">
                                <option value="AI 视频">AI 视频</option>
                                <option value="设计项目">设计项目</option>
                                <option value="品牌设计">品牌设计</option>
                              </select>
                              <textarea value={p.description} onChange={e => { const n = [...projects]; n[idx].description = e.target.value; setProjects(n); }} className="col-span-2 bg-white/5 border border-white/10 rounded-3xl px-8 py-5 focus:border-primary outline-none resize-none" rows={3} placeholder="作品描述" />
                              
                              {/* 视频链接输入 */}
                              <div className="col-span-2 space-y-3">
                                 <label className="text-[10px] font-black uppercase text-slate-500">视频链接（可选）</label>
                                 <div className="flex gap-4">
                                    <select 
                                      value={p.videoPlatform || 'other'} 
                                      onChange={e => { const n = [...projects]; n[idx].videoPlatform = e.target.value as any; setProjects(n); }}
                                      className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-primary outline-none text-sm"
                                    >
                                      <option value="other">其他</option>
                                      <option value="bilibili">Bilibili</option>
                                      <option value="youtube">YouTube</option>
                                    </select>
                                    <input 
                                      value={p.videoUrl || ''} 
                                      onChange={e => { const n = [...projects]; n[idx].videoUrl = e.target.value; setProjects(n); }}
                                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 focus:border-primary outline-none text-sm"
                                      placeholder="https://..."
                                    />
                                 </div>
                                 <p className="text-xs text-slate-600">支持 Bilibili、YouTube 或其他视频平台链接</p>
                              </div>
                           </div>
                           <button onClick={() => setProjects(projects.filter(proj => proj.id !== p.id))} className="text-red-500/30 hover:text-red-500 p-4 transition-all"><span className="material-symbols-outlined">delete</span></button>
                        </div>
                        {/* 本地视频上传 */}
                        <div className="pt-8 border-t border-white/5">
                           <div className="flex justify-between mb-6">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">本地视频</span>
                              <div className="flex gap-4">
                                 {p.localVideoUrl && (
                                    <button onClick={() => handleDeleteVideo(p.id, p.localVideoUrl!)} className="text-[10px] font-black text-red-400 uppercase hover:underline">删除视频</button>
                                 )}
                                 <button onClick={() => { setEditingProjectId(p.id); videoInputRef.current?.click(); }} className="text-[10px] font-black text-primary uppercase hover:underline">{p.localVideoUrl ? '更换视频' : '+ 上传视频'}</button>
                              </div>
                           </div>
                           {p.localVideoUrl ? (
                              <div className="relative aspect-video bg-black/50 rounded-2xl overflow-hidden">
                                 <video src={p.localVideoUrl} className="w-full h-full" controls />
                              </div>
                           ) : (
                              <div className="flex items-center justify-center h-32 bg-white/5 border border-dashed border-white/10 rounded-2xl text-slate-500 text-sm">
                                 <span className="material-symbols-outlined mr-2">videocam</span>
                                 暂无视频（支持 MP4/WebM，最大 50MB）
                              </div>
                           )}
                        </div>

                        {/* 画廊图片 */}
                        <div className="pt-8 border-t border-white/5">
                           <div className="flex justify-between mb-6">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">详情展示画廊 ({p.galleryImages?.length || 0})</span>
                              <button onClick={() => { setEditingProjectId(p.id); galleryInputRef.current?.click(); }} className="text-[10px] font-black text-primary uppercase hover:underline">+ 上传详情图</button>
                           </div>
                           <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                              {p.galleryImages?.map((img, i) => (
                                <div key={i} className="relative group/img size-32 shrink-0">
                                   <img 
                                     src={img} 
                                     className="w-full h-full rounded-2xl object-cover border border-white/10 shadow-xl"
                                     onError={(e) => {
                                       console.error('Admin gallery image failed to load:', img);
                                       (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/><text x="50" y="50" font-size="30" fill="%23666" text-anchor="middle" dy=".3em">?</text></svg>';
                                     }}
                                   />
                                   <button onClick={() => handleDeleteGalleryImage(p.id, img, i)} className="absolute -top-3 -right-3 size-8 bg-red-600 rounded-full text-white opacity-0 group-hover/img:opacity-100 transition-all shadow-xl flex items-center justify-center"><span className="material-symbols-outlined text-xs">close</span></button>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeAdminTab === 'system' && (
                  <div className="space-y-8">
                    <div className="max-w-3xl p-16 bg-indigo-600/10 border border-indigo-600/20 rounded-[4rem] space-y-10 text-left">
                       <div className="flex items-center justify-between">
                          <h3 className="text-4xl font-black italic uppercase tracking-tighter text-indigo-400">云端同步状态</h3>
                          {saveStatus !== 'idle' && (
                            <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                              saveStatus === 'saving' ? 'bg-yellow-500/20 text-yellow-400' :
                              saveStatus === 'saved' ? 'bg-green-500/20 text-green-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '保存失败'}
                            </span>
                          )}
                       </div>
                       <p className="text-slate-400 leading-relaxed text-lg">
                         {isSupabaseConfigured() 
                           ? '已连接到 Supabase 云端数据库。所有修改会自动保存到云端，无需重新部署即可生效。'
                           : '未配置 Supabase。当前使用本地存储模式，数据仅保存在当前浏览器中。'}
                       </p>
                       <div className="flex gap-4">
                          <button onClick={handleManualSave} disabled={saveStatus === 'saving'} className="flex-1 py-8 bg-indigo-600 rounded-[2.5rem] text-xs font-black uppercase shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                             <span className="material-symbols-outlined">save</span> {saveStatus === 'saving' ? '保存中...' : '立即保存到云端'}
                          </button>
                       </div>
                       <p className="text-xs text-slate-500">提示：修改内容后，建议点击"立即保存到云端"按钮确保数据已同步。</p>
                    </div>
                    <div className="max-w-3xl p-16 bg-white/[0.02] border border-white/10 rounded-[4rem] space-y-10 text-left">
                       <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-400">导出源码（备用）</h3>
                       <p className="text-slate-500 leading-relaxed text-lg">如需导出当前数据为代码文件，点击下方按钮。</p>
                       <button onClick={() => setShowExportModal(true)} className="w-full py-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-xs font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-4">
                          <span className="material-symbols-outlined">code</span> 生成 constants.tsx 源码
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl">
           <div className="w-full max-w-4xl h-[80vh] glass-effect border border-white/10 rounded-[4rem] flex flex-col p-16 animate-fade-in-up">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-4xl font-black italic uppercase tracking-tighter text-indigo-400">导出 constants.tsx 源码</h3>
                 <button onClick={() => setShowExportModal(false)} className="size-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all"><span className="material-symbols-outlined">close</span></button>
              </div>
              <textarea readOnly value={generateFullCode()} className="flex-1 bg-black/60 border border-white/5 rounded-[2.5rem] p-12 text-[10px] font-mono text-indigo-300 leading-relaxed resize-none custom-scrollbar outline-none" />
              <button onClick={copyToClipboard} className="mt-10 py-8 bg-indigo-600 text-white rounded-[2.5rem] text-xs font-black uppercase shadow-2xl flex items-center justify-center gap-4">
                 <span className="material-symbols-outlined">content_copy</span> 一键复制源码
              </button>
           </div>
        </div>
      )}

      <input type="file" ref={heroInputRef} hidden accept="image/*" onChange={e => handleImageUpload(e, 'hero')} />
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={e => editingProjectId && handleImageUpload(e, 'project', editingProjectId)} />
      <input type="file" ref={galleryInputRef} hidden accept="image/*" onChange={e => editingProjectId && handleImageUpload(e, 'gallery', editingProjectId)} />
      <input type="file" ref={videoInputRef} hidden accept="video/*" onChange={e => editingProjectId && handleVideoUpload(e, editingProjectId)} />
    </div>
  );
};

export default App;