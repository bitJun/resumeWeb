"use client";

import Link from "next/link";
import { PropsWithChildren } from "react";
import { Button, Layout, Space, Typography } from "antd";
import { BulbOutlined, DashboardOutlined, TeamOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";
import { useThemeMode } from "./app-providers";

const { Header, Content } = Layout;

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Layout className="app-shell">
      <Header className="shell-header">
        <div>
          <Typography.Text className="brand-kicker">AI Recruiting Console</Typography.Text>
          <Typography.Title level={3} className="brand-title">
            简历智能分析平台
          </Typography.Title>
        </div>
        <Space size={12} wrap>
          <Link href="/">
            <Button type={pathname === "/" ? "primary" : "default"} icon={<DashboardOutlined />}>
              驾驶舱
            </Button>
          </Link>
          <Link href="/candidates">
            <Button type={pathname?.startsWith("/candidates") ? "primary" : "default"} icon={<TeamOutlined />}>
              候选人面板
            </Button>
          </Link>
          <Button icon={<BulbOutlined />} onClick={toggleTheme}>
            {mode === "light" ? "暗色主题" : "亮色主题"}
          </Button>
        </Space>
      </Header>
      <Content className="shell-content">{children}</Content>
    </Layout>
  );
}
