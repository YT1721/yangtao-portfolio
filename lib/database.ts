import { supabase, isSupabaseConfigured } from "./supabase";
import { Project } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export { isSupabaseConfigured };

const PERSONAL_INFO_KEY = "personal_info";
const PROJECTS_KEY = "projects";

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

export interface SaveResult {
  success: boolean;
  message: string;
  cloudSaved: boolean;
  localBackup: boolean;
  retryCount?: number;
}

export interface LoadResult<T> {
  data: T;
  source: "cloud" | "local" | "default";
  message: string;
  success: boolean;
}

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
};

async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
): Promise<{
  result: T | null;
  retries: number;
  success: boolean;
  error?: Error;
}> {
  let retries = 0;
  let delay = RETRY_CONFIG.initialDelay;

  while (retries <= RETRY_CONFIG.maxRetries) {
    try {
      const result = await fn();
      if (retries > 0) {
        console.log(`${operationName}: 重试成功，共重试 ${retries} 次`);
      }
      return { result, retries, success: true };
    } catch (error) {
      retries++;
      console.warn(`${operationName}: 第 ${retries} 次尝试失败:`, error);

      if (retries > RETRY_CONFIG.maxRetries) {
        console.error(
          `${operationName}: 已达最大重试次数 ${RETRY_CONFIG.maxRetries}`,
        );
        return { result: null, retries, success: false, error: error as Error };
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(
        delay * RETRY_CONFIG.backoffFactor,
        RETRY_CONFIG.maxDelay,
      );
    }
  }

  return { result: null, retries: 0, success: false };
}

export async function saveWithBackup(
  saveFunction: () => Promise<boolean>,
  localStorageKey: string,
  data: any,
): Promise<SaveResult> {
  const result: SaveResult = {
    success: false,
    message: "",
    cloudSaved: false,
    localBackup: false,
    retryCount: 0,
  };

  if (isSupabaseConfigured()) {
    try {
      const { success, retries } = await withRetry(saveFunction, "云端保存");
      result.cloudSaved = success;
      result.retryCount = retries;

      try {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        result.localBackup = true;
      } catch (e) {
        console.warn("Local backup failed:", e);
      }

      if (success) {
        result.success = true;
        result.message =
          retries > 0 ? `已保存到云端（重试 ${retries} 次）` : "已保存到云端";
      } else {
        result.success = result.localBackup;
        result.message = result.localBackup
          ? "已保存到本地备份（云端保存失败）"
          : "保存失败";
      }
    } catch (error) {
      console.error("Save error:", error);
      result.message = "保存出错：" + (error as Error).message;

      try {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        result.localBackup = true;
        result.success = true;
        result.message = "已保存到本地备份（云端保存失败）";
      } catch (e) {
        console.error("Even local backup failed:", e);
      }
    }
  } else {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      result.localBackup = true;
      result.success = true;
      result.message = "已保存到本地（云端未配置）";
    } catch (e) {
      result.success = false;
      result.message = "本地存储已满，保存失败";
    }
  }

  return result;
}

const CACHE_EXPIRY_HOURS = 1; // 缓存有效期改为1小时，减少跨浏览器数据不一致

function isCacheValid(key: string): boolean {
  const expiryKey = `${key}_expiry`;
  const expiry = localStorage.getItem(expiryKey);
  if (!expiry) return false;
  return new Date().getTime() < parseInt(expiry);
}

function setCacheExpiry(key: string): void {
  const expiryKey = `${key}_expiry`;
  const expiry = new Date().getTime() + CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
  localStorage.setItem(expiryKey, expiry.toString());
}

async function fetchFromCloud<T>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .single();

    if (!error && data) {
      return data.value as T;
    }
  } catch (e) {
    console.error("Cloud fetch failed:", e);
  }
  return null;
}

export async function getPersonalInfo(): Promise<
  LoadResult<PersonalInfo | null>
> {
  const result: LoadResult<PersonalInfo | null> = {
    data: null,
    source: "default",
    message: "",
    success: false,
  };

  const localKey = "yt_profile";
  const backupKey = "yt_profile_backup";

  if (isCacheValid(localKey)) {
    const localData =
      localStorage.getItem(localKey) || localStorage.getItem(backupKey);
    if (localData) {
      console.log("使用缓存数据");
      result.data = JSON.parse(localData);
      result.source = "local";
      result.success = true;
      result.message = "已加载缓存数据";

      setTimeout(async () => {
        if (isSupabaseConfigured()) {
          console.log("后台刷新云端数据...");
          const cloudData =
            await fetchFromCloud<PersonalInfo>(PERSONAL_INFO_KEY);
          if (cloudData) {
            localStorage.setItem(localKey, JSON.stringify(cloudData));
            setCacheExpiry(localKey);
            localStorage.setItem(backupKey, JSON.stringify(cloudData));
            console.log("后台刷新完成");
          }
        }
      }, 100);

      return result;
    }
  }

  if (isSupabaseConfigured()) {
    console.log("尝试从云端加载数据...");
    const {
      result: cloudData,
      success,
      retries,
    } = await withRetry(
      () => fetchFromCloud<PersonalInfo>(PERSONAL_INFO_KEY),
      "加载个人信息",
    );

    if (success && cloudData) {
      localStorage.setItem(localKey, JSON.stringify(cloudData));
      setCacheExpiry(localKey);
      localStorage.setItem(backupKey, JSON.stringify(cloudData));
      result.data = cloudData;
      result.source = "cloud";
      result.success = true;
      result.message =
        retries > 0 ? `已从云端加载（重试 ${retries} 次）` : "已从云端加载";
      return result;
    }
  }

  const localData =
    localStorage.getItem(localKey) || localStorage.getItem(backupKey);
  if (localData) {
    result.data = JSON.parse(localData);
    result.source = "local";
    result.success = true;
    result.message = "云端不可用，使用本地数据";
    return result;
  }

  result.message = "无可用数据";
  return result;
}

export async function savePersonalInfo(
  info: PersonalInfo,
): Promise<SaveResult> {
  return saveWithBackup(
    async () => {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: PERSONAL_INFO_KEY, value: info }, { onConflict: "key" });
      return !error;
    },
    "yt_profile",
    info,
  );
}

export async function getProjects(): Promise<LoadResult<Project[]>> {
  const result: LoadResult<Project[]> = {
    data: [],
    source: "default",
    message: "",
    success: false,
  };

  const localKey = "yt_projects";
  const backupKey = "yt_projects_backup";

  if (isCacheValid(localKey)) {
    const localData =
      localStorage.getItem(localKey) || localStorage.getItem(backupKey);
    if (localData) {
      console.log("使用缓存数据");
      result.data = JSON.parse(localData);
      result.source = "local";
      result.success = true;
      result.message = "已加载缓存数据";

      setTimeout(async () => {
        if (isSupabaseConfigured()) {
          console.log("后台刷新云端项目数据...");
          const cloudData = await fetchFromCloud<Project[]>(PROJECTS_KEY);
          if (cloudData) {
            localStorage.setItem(localKey, JSON.stringify(cloudData));
            setCacheExpiry(localKey);
            localStorage.setItem(backupKey, JSON.stringify(cloudData));
            console.log("后台刷新完成");
          }
        }
      }, 100);

      return result;
    }
  }

  if (isSupabaseConfigured()) {
    console.log("尝试从云端加载项目数据...");
    const {
      result: cloudData,
      success,
      retries,
    } = await withRetry(
      () => fetchFromCloud<Project[]>(PROJECTS_KEY),
      "加载项目列表",
    );

    if (success && cloudData) {
      localStorage.setItem(localKey, JSON.stringify(cloudData));
      setCacheExpiry(localKey);
      localStorage.setItem(backupKey, JSON.stringify(cloudData));
      result.data = cloudData;
      result.source = "cloud";
      result.success = true;
      result.message =
        retries > 0 ? `已从云端加载（重试 ${retries} 次）` : "已从云端加载";
      return result;
    }
  }

  const localData =
    localStorage.getItem(localKey) || localStorage.getItem(backupKey);
  if (localData) {
    result.data = JSON.parse(localData);
    result.source = "local";
    result.success = true;
    result.message = "云端不可用，使用本地数据";
    return result;
  }

  result.message = "无可用项目数据";
  return result;
}

export async function saveProjects(projects: Project[]): Promise<SaveResult> {
  return saveWithBackup(
    async () => {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: PROJECTS_KEY, value: projects }, { onConflict: "key" });
      return !error;
    },
    "yt_projects",
    projects,
  );
}

async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.7,
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      console.log(
        "Image compressed:",
        (file.size / 1024).toFixed(2),
        "KB →",
        (compressedBase64.length / 1024).toFixed(2),
        "KB",
      );
      resolve(compressedBase64);
    };

    img.onerror = () => {
      console.error("Failed to load image");
      resolve(null);
    };

    img.src = URL.createObjectURL(file);
  });
}

export interface UploadResult {
  success: boolean;
  url: string | null;
  message: string;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  console.log("Uploading image:", file.name);

  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      url: null,
      message: "图片过大，请压缩至 5MB 以下",
    };
  }

  const compressed = await compressImage(file, 1200, 1200, 0.7);

  if (!compressed) {
    return { success: false, url: null, message: "图片处理失败" };
  }

  if (compressed.length > 500 * 1024) {
    const further = await compressImage(file, 800, 800, 0.5);
    if (further) {
      return { success: true, url: further, message: "图片已压缩上传" };
    }
  }

  return { success: true, url: compressed, message: "图片上传成功" };
}

export async function uploadVideo(file: File): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, url: null, message: "云端未配置，无法上传视频" };
  }

  if (file.size > 50 * 1024 * 1024) {
    return {
      success: false,
      url: null,
      message: "视频过大，请压缩至 50MB 以下",
    };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `videos/${fileName}`;

  const { success, result: error } = await withRetry(async () => {
    const { error } = await supabase.storage
      .from("portfolio")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });
    return error;
  }, "视频上传");

  if (error) {
    return {
      success: false,
      url: null,
      message: "视频上传失败：" + error.message,
    };
  }

  const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);
  return { success: true, url: data.publicUrl, message: "视频上传成功" };
}

export async function deleteVideo(url: string): Promise<void> {
  if (!isSupabaseConfigured() || !url.includes("supabase")) {
    return;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const bucketIndex = pathParts.indexOf("portfolio");
    if (bucketIndex === -1) return;

    const filePath = pathParts.slice(bucketIndex + 1).join("/");
    await supabase.storage.from("portfolio").remove([filePath]);
  } catch (e) {
    console.error("Delete video error:", e);
  }
}

export async function deleteImage(url: string): Promise<void> {
  if (url.startsWith("data:")) {
    return;
  }

  if (!isSupabaseConfigured() || !url.includes("supabase")) {
    return;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const bucketIndex = pathParts.indexOf("portfolio");
    if (bucketIndex === -1) return;

    const filePath = pathParts.slice(bucketIndex + 1).join("/");
    await supabase.storage.from("portfolio").remove([filePath]);
  } catch (e) {
    console.error("Delete image error:", e);
  }
}

export function preloadData(): Promise<void> {
  return new Promise((resolve) => {
    console.log("开始预加载数据...");

    const preloadStartTime = performance.now();

    Promise.all([getPersonalInfo(), getProjects()])
      .then(([infoResult, projectsResult]) => {
        const preloadEndTime = performance.now();
        const duration = (preloadEndTime - preloadStartTime).toFixed(2);

        console.log(`预加载完成，耗时 ${duration}ms`);
        console.log("个人信息:", infoResult.source, infoResult.success);
        console.log(
          "项目数据:",
          projectsResult.source,
          projectsResult.data.length,
          "个项目",
        );

        resolve();
      })
      .catch((err) => {
        console.error("预加载失败:", err);
        resolve();
      });
  });
}

// 清除本地缓存，强制从云端刷新数据
export function clearCache(): void {
  const keys = [
    "yt_profile",
    "yt_profile_expiry",
    "yt_profile_backup",
    "yt_projects",
    "yt_projects_expiry",
    "yt_projects_backup",
  ];

  keys.forEach((key) => {
    localStorage.removeItem(key);
  });

  console.log("本地缓存已清除，请刷新页面");
}
