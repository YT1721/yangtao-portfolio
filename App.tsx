import React, { useState, useEffect, useRef, useCallback } from "react";
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
  CUSTOMER_LOGOS as DEFAULT_CUSTOMERS,
} from "./constants";
import { Project } from "./types";
import {
  getPersonalInfo,
  getProjects,
  savePersonalInfo,
  saveProjects,
  uploadImage,
  uploadVideo,
  deleteImage,
  deleteVideo,
  isSupabaseConfigured,
  SaveResult,
  UploadResult,
  preloadData,
  LoadResult,
} from "./lib/database";

const ADMIN_PASSWORD = "yangtao666";

const App: React.FC = () => {
  const [personalInfo, setPersonalInfo] = useState(DEFAULT_INFO);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState("初始化...");
  const [loadingSource, setLoadingSource] = useState("");
  const [currentView, setCurrentView] = useState<"home" | "detail">("home");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [activeTab, setActiveTab] = useState<
    "全部" | "AI 视频" | "设计项目" | "品牌设计"
  >("全部");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadingPhase("正在连接云端...");

      try {
        setLoadingPhase("加载个人信息...");
        const infoResult: LoadResult<typeof DEFAULT_INFO | null> =
          await getPersonalInfo();
        setLoadingSource(
          infoResult.source === "cloud"
            ? "云端"
            : infoResult.source === "local"
              ? "本地缓存"
              : "默认数据",
        );

        if (infoResult.data) {
          setPersonalInfo(infoResult.data);
          console.log("个人信息加载成功:", infoResult.message);
        } else {
          setPersonalInfo(DEFAULT_INFO);
        }

        setLoadingPhase("加载作品数据...");
        const projectsResult: LoadResult<Project[]> = await getProjects();

        if (projectsResult.data && projectsResult.data.length > 0) {
          setProjects(projectsResult.data);
          console.log("项目数据加载成功:", projectsResult.message);
        } else {
          setProjects(DEFAULT_PROJECTS);
        }

        if (infoResult.source === "local" && isSupabaseConfigured()) {
          setLoadingPhase("后台同步云端数据...");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setProjects(DEFAULT_PROJECTS);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    preloadData();
  }, []);

  const showSaveNotification = useCallback((result: SaveResult) => {
    if (result.cloudSaved && result.localBackup) {
      setSaveStatus("saved");
      setSaveMessage("✅ 已保存到云端 + 本地备份");
    } else if (result.cloudSaved) {
      setSaveStatus("saved");
      setSaveMessage("✅ 已保存到云端");
    } else if (result.localBackup) {
      setSaveStatus("saved");
      setSaveMessage("⚠️ 已保存到本地备份（云端同步失败）");
    } else {
      setSaveStatus("error");
      setSaveMessage("❌ 保存失败：" + result.message);
    }

    setTimeout(() => {
      setSaveStatus("idle");
      setSaveMessage("");
    }, 3000);
  }, []);

  const handleManualSave = async () => {
    setSaveStatus("saving");
    setSaveMessage("正在保存...");
    try {
      const [infoResult, projectsResult] = await Promise.all([
        savePersonalInfo(personalInfo),
        saveProjects(projects),
      ]);
      showSaveNotification(projectsResult);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setSaveMessage("保存出错：" + (error as Error).message);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      setSaveMessage("自动保存中...");
      try {
        const result = await saveProjects(projects);
        showSaveNotification(result);
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [projects, isLoading, showSaveNotification]);

  const handleAuth = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      localStorage.setItem("yt_admin_auth", "true");
      setIsAdminMode(true);
      setShowPasswordModal(false);
      setPasswordInput("");
    } else {
      alert("密码错误");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("yt_admin_auth");
    setIsAdminMode(false);
  };

  useEffect(() => {
    const auth = localStorage.getItem("yt_admin_auth");
    if (auth === "true") {
      setIsAdminMode(true);
    }
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (activeTab === "全部") return true;
    if (activeTab === "AI 视频") return p.category.includes("AI");
    if (activeTab === "设计项目")
      return p.category.includes("设计") || p.category.includes("UI");
    if (activeTab === "品牌设计")
      return p.category.includes("品牌") || p.category.includes("包装");
    return true;
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "hero" | "project" | "gallery" | "video",
    projectId?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(`正在处理: ${file.name}`);

    try {
      if (type === "video" && projectId) {
        setUploadProgress("上传视频中...");
        const result: UploadResult = await uploadVideo(file);
        if (result.success && result.url) {
          setProjects(
            projects.map((p) =>
              p.id === projectId ? { ...p, localVideoUrl: result.url } : p,
            ),
          );
          alert("视频上传成功！");
        } else {
          alert(result.message);
        }
      } else {
        setUploadProgress("压缩图片中...");
        const result: UploadResult = await uploadImage(file);

        if (result.success && result.url) {
          if (type === "hero") {
            setPersonalInfo({ ...personalInfo, heroImageUrl: result.url });
          } else if (type === "project" && projectId) {
            setProjects(
              projects.map((p) =>
                p.id === projectId ? { ...p, imageUrl: result.url } : p,
              ),
            );
          } else if (type === "gallery" && projectId) {
            setProjects(
              projects.map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      galleryImages: [...(p.galleryImages || []), result.url],
                    }
                  : p,
              ),
            );
          }
          alert(result.message);
        } else {
          alert(result.message);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("上传失败：" + (error as Error).message);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  const handleAddProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "新作品",
      category: "AI 视频",
      description: "作品描述...",
      imageUrl: `https://picsum.photos/1200/800?t=${Date.now()}`,
      tags: [],
      galleryImages: [],
    };
    setProjects([newProject, ...projects]);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("确定要删除这个作品吗？")) return;

    const project = projects.find((p) => p.id === id);
    if (project?.imageUrl && !project.imageUrl.startsWith("data:")) {
      await deleteImage(project.imageUrl);
    }
    if (project?.localVideoUrl) {
      await deleteVideo(project.localVideoUrl);
    }
    if (project?.galleryImages) {
      for (const img of project.galleryImages) {
        await deleteImage(img);
      }
    }

    setProjects(projects.filter((p) => p.id !== id));
    alert("作品已删除");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark text-white flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary">
                sparkles
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
            YANG TAO
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-slate-300 text-sm font-medium">
              {loadingPhase}
            </span>
          </div>
          {loadingSource && (
            <p className="text-xs text-slate-500 mt-2">
              数据来源: {loadingSource}
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-8 bg-gradient-to-t from-primary/20 to-primary/60 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  height: `${20 + Math.random() * 16}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isAdminMode && !currentView === "home") {
    setCurrentView("home");
  }

  if (currentView === "detail" && selectedProject) {
    return (
      <div className="min-h-screen bg-background-dark text-white animate-fade-in">
        <nav className="fixed top-0 w-full z-50 glass-effect h-20 px-6 md:px-12 flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentView("home");
              setSelectedProjectId(null);
            }}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>{" "}
            返回
          </button>
          <div className="text-[10px] font-black uppercase tracking-tighter text-slate-600">
            {selectedProject.title}
          </div>
        </nav>
        <main className="pt-32 pb-20 px-6 md:px-12 max-w-5xl mx-auto text-center md:text-left">
          <div className="mb-16">
            <div className="text-primary text-[10px] font-bold uppercase tracking-[0.5em] mb-4">
              {selectedProject.category}
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-none">
              {selectedProject.title}
            </h1>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto md:mx-0 mb-20">
              {selectedProject.description}
            </p>
            <img
              src={selectedProject.imageUrl}
              className="w-full rounded-[2.5rem] shadow-2xl border border-white/5 mb-10"
              alt="Main"
            />

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

            {selectedProject.videoUrl && !selectedProject.localVideoUrl && (
              <div className="w-full rounded-[2.5rem] overflow-hidden border border-white/5 mb-10 bg-black/50">
                {selectedProject.videoPlatform === "bilibili" ? (
                  <div className="relative aspect-video">
                    <iframe
                      src={`//player.bilibili.com/player.html?bvid=${selectedProject.videoUrl.match(/BV[a-zA-Z0-9]+/)?.[0] || ""}&page=1&high_quality=1&danmaku=0`}
                      className="w-full h-full"
                      allowFullScreen
                      scrolling="no"
                      frameBorder="0"
                      sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
                    />
                  </div>
                ) : selectedProject.videoPlatform === "youtube" ? (
                  <div className="relative aspect-video">
                    <iframe
                      src={selectedProject.videoUrl
                        .replace("youtube.com/watch?v=", "youtube.com/embed/")
                        .replace("youtu.be/", "youtube.com/embed/")}
                      className="w-full h-full"
                      allowFullScreen
                      frameBorder="0"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video flex items-center justify-center bg-surface-dark">
                    <a
                      href={selectedProject.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-4 text-primary hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-6xl">
                        play_circle
                      </span>
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
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/><text x="50" y="50" font-size="40" fill="%23666" text-anchor="middle" dy=".3em">?</text></svg>';
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
        <section className="relative min-h-screen flex flex-col lg:flex-row items-center pt-10 overflow-hidden">
          <div className="flex-1 px-6 md:px-12 py-20 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-10">
              <span className="material-symbols-outlined text-sm">
                verified
              </span>{" "}
              {personalInfo.zhTitle}
            </div>
            <h1 className="text-7xl md:text-[10rem] font-bold tracking-tighter leading-[0.8] mb-12 uppercase flex flex-col">
              <span className="flex items-baseline gap-4">
                <span>{personalInfo.engName.split(" ")[0]}</span>
                <span className="text-2xl md:text-4xl font-black text-white/50 tracking-tighter lowercase">
                  {personalInfo.name}
                </span>
              </span>
              <span className="text-gradient">
                {personalInfo.engName.split(" ")[1]}
              </span>
            </h1>
            <p className="max-w-xl text-xl text-slate-400 font-light leading-relaxed mb-12">
              {personalInfo.bio}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 border-t border-white/5 pt-12">
              {Object.entries(personalInfo.details).map(([key, value]) => (
                <div key={key}>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2">
                    {key}
                  </div>
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
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute bottom-20 right-10 z-20 text-right">
              <div className="text-sm font-black uppercase tracking-[0.4em] mb-4 text-primary drop-shadow-[0_0_10px_rgba(55,19,236,0.8)]">
                PORTFOLIO EDITION
              </div>
              <div className="flex flex-col items-end">
                <div className="text-6xl md:text-8xl font-black italic uppercase text-white leading-[0.85] tracking-tighter">
                  CRAFT
                </div>
                <div className="text-4xl md:text-7xl font-black italic uppercase text-white flex items-center gap-4 tracking-tighter">
                  <span className="text-primary">&</span> AI FUTURE
                </div>
              </div>
              <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 italic">
                匠心筑梦 · AI 驱动未来
              </div>
            </div>
          </div>
        </section>

        <section className="py-40 bg-surface-dark relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="flex flex-col lg:flex-row gap-24">
              <div className="lg:w-[40%]">
                <div className="relative inline-block">
                  <div className="text-[14rem] font-black text-white/5 leading-none tracking-tighter select-none">
                    18<span className="text-primary">+</span>
                  </div>
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 pt-10">
                    <h2 className="text-5xl md:text-6xl font-black italic uppercase leading-tight tracking-tighter">
                      CORE
                      <br />
                      <span className="text-primary italic">EXPERTISE</span>
                    </h2>
                  </div>
                </div>
              </div>
              <div className="lg:w-[60%] space-y-12">
                <p className="text-2xl md:text-4xl font-light leading-snug tracking-tight text-white/90">
                  拥有{" "}
                  <span className="font-black italic border-b-2 border-primary/40">
                    18 年+
                  </span>{" "}
                  设计行业全领域深耕经验，兼具"传统设计功底 +{" "}
                  <span className="text-primary font-bold italic">
                    AI 技术落地
                  </span>{" "}
                  + 全流程项目把控"的复合型核心优势。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                    <div className="text-primary font-black text-[10px] uppercase tracking-[0.4em] mb-4">
                      2023 AIGC 聚焦
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      精通生图模型部署、Lora
                      训练等核心技能，实现创意生产效率的指数级提升。
                    </p>
                  </div>
                  <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                    <div className="text-primary font-black text-[10px] uppercase tracking-[0.4em] mb-4">
                      2025 AI 视频创作
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      转型 AI
                      漫剧与商业视频创作，掌握编剧-导演-分镜-美术-剪辑全流程。已实现商业化落地。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-surface-dark relative border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-blue-400">
                  business
                </span>
              </div>
              <h2 className="text-2xl font-bold">服务过的客户</h2>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white">
              <img
                src="/customers.png"
                alt="服务过的客户"
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>

        <section className="py-40 bg-background-dark relative border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <h2 className="text-4xl font-bold mb-16">个人能力</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-white/80 mb-8">
                  综合素质能力
                </h3>
                <div className="space-y-6">
                  {DEFAULT_SCORES.map((skill, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white/80">
                          {skill.name}
                        </span>
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
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-white/80 mb-8">
                  知识储备
                </h3>
                <div className="space-y-6">
                  {DEFAULT_MANAGEMENT.map((skill, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white/80">
                          {skill.name}
                        </span>
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
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-white/80 mb-8">
                  软件应用能力
                </h3>
                <div className="space-y-5">
                  {DEFAULT_SOFTWARE.map((sw, i) => {
                    const getSoftwareIcon = (name: string) => {
                      const icons: Record<string, string> = {
                        Illustrator: "Ill",
                        Photoshop: "Pho",
                        Figma: "Fig",
                        Sketch: "Ske",
                        MasterGo: "Mas",
                        Midjourney: "Mid",
                        "Stable Diffusion": "Sta",
                        ComfyUI: "Com",
                        "Cinema 4D": "Cin",
                        Indesign: "Ind",
                        剪映: "剪映",
                        Procreate: "Pro",
                      };
                      return icons[name] || name.substring(0, 3);
                    };

                    return (
                      <div key={i} className="group">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400">
                            {getSoftwareIcon(sw.name)}
                          </div>
                          <span className="text-sm font-medium text-white/80">
                            {sw.name}
                          </span>
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

        <section className="py-24 bg-surface-dark relative border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-20">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-primary">
                    school
                  </span>
                </div>
                <h2 className="text-2xl font-bold">教育经历</h2>
              </div>
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/30 to-transparent hidden md:block"></div>
                <div className="space-y-4">
                  {DEFAULT_EDUCATION.map((edu, i) => (
                    <div
                      key={i}
                      className="relative flex flex-col md:flex-row gap-4 md:gap-8 group"
                    >
                      <div className="flex items-center gap-3 md:w-36 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
                          <span className="text-sm font-bold text-white">
                            {edu.degree.includes("大专")
                              ? "专"
                              : edu.degree.substring(0, 1)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 md:hidden">
                          {edu.period}
                        </span>
                      </div>
                      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-primary/30 hover:bg-white/[0.04] transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                            {edu.school}
                          </h3>
                          <span className="text-xs text-slate-500 hidden md:block">
                            {edu.period}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{edu.major}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-blue-400">
                    work
                  </span>
                </div>
                <h2 className="text-2xl font-bold">工作经历</h2>
              </div>
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-blue-500/30 to-transparent hidden md:block"></div>
                <div className="space-y-4">
                  {DEFAULT_EXPERIENCE.map((exp, i) => (
                    <div
                      key={i}
                      className="relative flex flex-col md:flex-row gap-4 md:gap-8 group"
                    >
                      <div className="flex items-center gap-3 md:w-36 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all">
                          <span className="text-[10px] text-slate-400">
                            {exp.year.split("-")[0].slice(2)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 md:hidden">
                          {exp.year}
                        </span>
                      </div>
                      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                              {exp.company}
                            </h3>
                            {exp.level && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                                {exp.level}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 hidden md:block">
                            {exp.year}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {exp.role} · {exp.department}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="works" className="py-40 bg-background-dark">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-28">
              <div className="max-w-xl text-left">
                <h2 className="text-7xl md:text-9xl font-black italic uppercase leading-[0.75] tracking-tighter text-white mb-6">
                  SELECTED
                  <br />
                  WORKS
                </h2>
                <div className="flex items-center gap-4">
                  <div className="h-[2px] w-12 bg-primary"></div>
                  <p className="text-primary text-sm font-black uppercase tracking-[0.4em]">
                    精选作品展示 / PORTFOLIO
                  </p>
                </div>
              </div>
              <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-4">
                {(["全部", "AI 视频", "设计项目", "品牌设计"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-[10px] font-bold uppercase rounded-xl transition-all ${activeTab === tab ? "bg-primary text-white shadow-xl" : "text-slate-500 hover:text-white"}`}
                    >
                      {tab}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setCurrentView("detail");
                    window.scrollTo(0, 0);
                  }}
                  className="group relative rounded-[3rem] overflow-hidden bg-surface-dark border border-white/5 h-[600px] cursor-pointer"
                >
                  <img
                    src={project.imageUrl}
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                    alt={project.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/><text x="50" y="50" font-size="20" fill="%23666" text-anchor="middle" dy=".3em">No Image</text></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-12 transform translate-y-8 group-hover:translate-y-0 transition-all duration-700">
                    <span className="px-3 py-1.5 bg-primary/20 backdrop-blur-md text-primary text-[9px] font-black uppercase rounded-lg mb-6 inline-block tracking-widest border border-primary/30 italic">
                      {project.category}
                    </span>
                    <h3 className="text-4xl font-black text-white mb-3 uppercase group-hover:text-primary transition-colors tracking-tighter italic">
                      {project.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-500 font-light">
                      {project.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-background-dark border-t border-white/5 py-32 text-center">
          <div className="text-[10px] uppercase tracking-[1em] font-black text-slate-800 italic">
            Yang Tao Creative & AI Labs © 2026
          </div>
        </footer>
      </main>

      <button
        onClick={() => setShowPasswordModal(true)}
        className="fixed bottom-10 right-10 size-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-slate-700 hover:text-primary transition-all z-[100] opacity-10 hover:opacity-100"
      >
        <span className="material-symbols-outlined text-sm">settings</span>
      </button>

      {/* 密码输入弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6">
              进入管理后台
            </h2>
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-primary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAuth();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                  }}
                  className="flex-1 px-6 py-3 bg-white/10 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAuth}
                  className="flex-1 px-6 py-3 bg-primary rounded-xl text-xs font-bold uppercase hover:bg-primary/80 transition-all"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {saveStatus !== "idle" && (
        <div
          className={`fixed bottom-10 left-10 px-4 py-2 rounded-full text-xs font-bold uppercase z-[9999] transition-all shadow-lg ${
            saveStatus === "saving"
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : saveStatus === "saved"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {saveMessage ||
            (saveStatus === "saving"
              ? "保存中..."
              : saveStatus === "saved"
                ? "已保存"
                : "保存失败")}
        </div>
      )}

      {isUploading && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 z-[9999] text-center shadow-2xl">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium">{uploadProgress}</p>
        </div>
      )}

      {isAdminMode && (
        <div className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-lg overflow-y-auto">
          <div className="min-h-screen p-8 md:p-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                    作品管理后台
                  </h1>
                  <p className="text-slate-400 mt-2">
                    共 {projects.length} 个作品 |
                    {isSupabaseConfigured() ? (
                      <span className="text-green-400 ml-2">● 云端已连接</span>
                    ) : (
                      <span className="text-yellow-400 ml-2">● 仅本地存储</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleManualSave}
                    className="px-6 py-3 bg-primary rounded-xl text-xs font-bold uppercase hover:bg-primary/80 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">
                      save
                    </span>{" "}
                    保存全部
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-white/10 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all"
                  >
                    退出管理
                  </button>
                </div>
              </div>

              <div className="mb-8 flex gap-4 flex-wrap">
                <button
                  onClick={handleAddProject}
                  className="px-8 py-4 bg-green-600 rounded-2xl text-sm font-bold uppercase hover:bg-green-500 transition-all flex items-center gap-2 shadow-lg"
                >
                  <span className="material-symbols-outlined">add</span>{" "}
                  添加新作品
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50">
                      <img
                        src={p.imageUrl}
                        className="w-full h-full object-cover"
                        alt={p.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/></svg>';
                        }}
                      />
                      <button
                        onClick={() => {
                          setEditingProjectId(p.id);
                          fileInputRef.current?.click();
                        }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-4xl text-white">
                          photo_camera
                        </span>
                      </button>
                    </div>

                    <input
                      value={p.title}
                      onChange={(e) =>
                        setProjects(
                          projects.map((proj) =>
                            proj.id === p.id
                              ? { ...proj, title: e.target.value }
                              : proj,
                          ),
                        )
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
                      placeholder="作品标题"
                    />

                    <select
                      value={p.category}
                      onChange={(e) =>
                        setProjects(
                          projects.map((proj) =>
                            proj.id === p.id
                              ? { ...proj, category: e.target.value }
                              : proj,
                          ),
                        )
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                    >
                      <option value="AI 视频">AI 视频</option>
                      <option value="设计项目">设计项目</option>
                      <option value="品牌设计">品牌设计</option>
                    </select>

                    <textarea
                      value={p.description}
                      onChange={(e) =>
                        setProjects(
                          projects.map((proj) =>
                            proj.id === p.id
                              ? { ...proj, description: e.target.value }
                              : proj,
                          ),
                        )
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm resize-none h-24 focus:border-primary outline-none"
                      placeholder="作品描述..."
                    />

                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          画廊图片 ({p.galleryImages?.length || 0})
                        </span>
                        <button
                          onClick={() => {
                            setEditingProjectId(p.id);
                            galleryInputRef.current?.click();
                          }}
                          className="text-xs font-bold text-primary uppercase hover:underline"
                        >
                          + 添加
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {p.galleryImages?.map((img, i) => (
                          <div key={i} className="relative shrink-0">
                            <img
                              src={img}
                              className="w-20 h-20 object-cover rounded-xl"
                              alt={`Gallery ${i}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/></svg>';
                              }}
                            />
                            <button
                              onClick={() => {
                                setProjects(
                                  projects.map((proj) =>
                                    proj.id === p.id
                                      ? {
                                          ...proj,
                                          galleryImages:
                                            proj.galleryImages?.filter(
                                              (_, idx) => idx !== i,
                                            ),
                                        }
                                      : proj,
                                  ),
                                );
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full text-white flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          本地视频
                        </span>
                        <button
                          onClick={() => {
                            setEditingProjectId(p.id);
                            videoInputRef.current?.click();
                          }}
                          className="text-xs font-bold text-primary uppercase hover:underline"
                        >
                          {p.localVideoUrl ? "更换视频" : "+ 添加视频"}
                        </button>
                      </div>
                      {p.localVideoUrl && (
                        <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden mb-4">
                          <video
                            src={p.localVideoUrl}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() =>
                              setProjects(
                                projects.map((proj) =>
                                  proj.id === p.id
                                    ? { ...proj, localVideoUrl: undefined }
                                    : proj,
                                ),
                              )
                            }
                            className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full text-white flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      <div className="border-t border-white/5 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold uppercase text-slate-400">
                            在线视频链接
                          </span>
                        </div>

                        <select
                          value={p.videoPlatform || "other"}
                          onChange={(e) =>
                            setProjects(
                              projects.map((proj) =>
                                proj.id === p.id
                                  ? {
                                      ...proj,
                                      videoPlatform: e.target.value as any,
                                    }
                                  : proj,
                              ),
                            )
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none mb-3"
                        >
                          <option value="bilibili">Bilibili</option>
                          <option value="youtube">YouTube</option>
                          <option value="other">其他视频平台</option>
                        </select>

                        <input
                          value={p.videoUrl || ""}
                          onChange={(e) =>
                            setProjects(
                              projects.map((proj) =>
                                proj.id === p.id
                                  ? { ...proj, videoUrl: e.target.value }
                                  : proj,
                              ),
                            )
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none mb-2"
                          placeholder={
                            p.videoPlatform === "bilibili"
                              ? "粘贴 Bilibili 视频链接或 BV 号（如 BV1xx...）"
                              : p.videoPlatform === "youtube"
                                ? "粘贴 YouTube 视频链接（如 https://www.youtube.com/watch?v=...）"
                                : "粘贴视频链接"
                          }
                        />

                        {p.videoUrl && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              已设置视频链接
                            </span>
                            <button
                              onClick={() =>
                                setProjects(
                                  projects.map((proj) =>
                                    proj.id === p.id
                                      ? {
                                          ...proj,
                                          videoUrl: undefined,
                                          videoPlatform: undefined,
                                        }
                                      : proj,
                                  ),
                                )
                              }
                              className="text-xs text-red-400 hover:text-red-300 font-bold"
                            >
                              清除视频链接
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="w-full py-3 bg-red-600/20 border border-red-600/30 rounded-xl text-red-400 text-xs font-bold uppercase hover:bg-red-600 hover:text-white transition-all mt-4"
                    >
                      删除作品
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={heroInputRef}
        hidden
        accept="image/*"
        onChange={(e) => handleUpload(e, "hero")}
      />
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/*"
        onChange={(e) =>
          editingProjectId && handleUpload(e, "project", editingProjectId)
        }
      />
      <input
        type="file"
        ref={galleryInputRef}
        hidden
        accept="image/*"
        onChange={(e) =>
          editingProjectId && handleUpload(e, "gallery", editingProjectId)
        }
      />
      <input
        type="file"
        ref={videoInputRef}
        hidden
        accept="video/*"
        onChange={(e) =>
          editingProjectId && handleUpload(e, "video", editingProjectId)
        }
      />
    </div>
  );
};

export default App;
