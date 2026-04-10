import type { Metadata } from "next";
import { AppProviders } from "@/components/layout/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 简历分析平台",
  description: "支持 PDF 简历上传、AI 信息提取、岗位匹配与候选人管理的全栈应用"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
