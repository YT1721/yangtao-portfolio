import { supabase, isSupabaseConfigured } from "./supabase";
import { Project } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export async function runDiagnostics(): Promise<{
  supabaseUrl: boolean;
  supabaseKey: boolean;
  tableExists: boolean;
  tableWritable: boolean;
  storageExists: boolean;
  overallStatus: "ok" | "partial" | "failed";
  messages: string[];
}> {
  const messages: string[] = [];
  let tableExists = false;
  let tableWritable = false;
  let storageExists = false;

  messages.push(`检查 Supabase URL: ${SUPABASE_URL ? "已配置" : "未配置"}`);
  messages.push(`检查 Supabase Key: ${SUPABASE_KEY ? "已配置" : "未配置"}`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    messages.push("❌ 环境变量未正确配置");
    return {
      supabaseUrl: false,
      supabaseKey: false,
      tableExists: false,
      tableWritable: false,
      storageExists: false,
      overallStatus: "failed",
      messages,
    };
  }

  messages.push("✓ Supabase 环境变量已配置");

  try {
    const { data, error } = await supabase
      .from("settings")
      .select("key")
      .limit(1);

    if (error) {
      messages.push(`❌ settings 表不存在或无法访问: ${error.message}`);

      const tableError = error as any;
      if (tableError?.code === "42P01") {
        messages.push("💡 提示: 需要在 Supabase 中创建 settings 表");
        messages.push("请在 Supabase SQL Editor 中运行以下 SQL:");
        messages.push(
          `
CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read" ON settings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous update" ON settings FOR ALL TO anon USING (true) WITH CHECK (true);
        `.trim(),
        );
      }
    } else {
      tableExists = true;
      messages.push("✓ settings 表存在");
    }
  } catch (e) {
    messages.push(`❌ 无法连接到 Supabase: ${(e as Error).message}`);
  }

  if (tableExists) {
    try {
      const testData = {
        key: "__diagnostic_test__",
        value: { test: true, timestamp: Date.now() },
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("settings")
        .upsert(testData, { onConflict: "key" });

      if (insertError) {
        messages.push(`❌ settings 表无法写入: ${insertError.message}`);
        if (insertError.message.includes("permission")) {
          messages.push("💡 提示: 需要在 Supabase 中添加 RLS 策略");
        }
      } else {
        tableWritable = true;
        messages.push("✓ settings 表可读写");

        await supabase
          .from("settings")
          .delete()
          .eq("key", "__diagnostic_test__");
      }
    } catch (e) {
      messages.push(`❌ 测试写入失败: ${(e as Error).message}`);
    }
  }

  try {
    const { data, error } = await supabase.storage.listBuckets();
    const portfolioBucket = data?.find((b) => b.name === "portfolio");

    if (error) {
      messages.push(`❌ Storage 检查失败: ${error.message}`);
    } else if (!portfolioBucket) {
      messages.push("⚠️ portfolio 存储桶不存在（图片将使用 Base64 存储）");
    } else {
      storageExists = true;
      messages.push("✓ portfolio 存储桶存在");
    }
  } catch (e) {
    messages.push(`⚠️ Storage 检查跳过: ${(e as Error).message}`);
  }

  let overallStatus: "ok" | "partial" | "failed" = "ok";
  if (!tableWritable) {
    overallStatus = "failed";
    messages.push("");
    messages.push("=== 诊断结论 ===");
    messages.push("数据将保存到 localStorage（仅本地有效）");
    messages.push("请按 DEPLOY.md 文档配置 Supabase 数据库表");
  } else if (tableExists && tableWritable) {
    messages.push("");
    messages.push("=== 诊断结论 ===");
    messages.push("✅ Supabase 配置正确！数据将保存到云端");
  }

  return {
    supabaseUrl: !!SUPABASE_URL,
    supabaseKey: !!SUPABASE_KEY,
    tableExists,
    tableWritable,
    storageExists,
    overallStatus,
    messages,
  };
}
