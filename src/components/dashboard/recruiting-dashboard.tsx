"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { App, Card, Space, Typography } from "antd";
import { listCandidates, listJobs } from "@/lib/api";
import { CandidateRecord, JobDescriptionRecord } from "@/types/api";
import { OverviewStrip } from "./overview-strip";
import { UploadWorkbench } from "./upload-workbench";
import { JobConfigPanel } from "./job-config-panel";
import { RecentCandidates } from "./recent-candidates";

export function RecruitingDashboard() {
  const { message } = App.useApp();
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [jobs, setJobs] = useState<JobDescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [candidateResponse, jobResponse] = await Promise.all([
        listCandidates({ page: 1, pageSize: 12, sortBy: "uploadedAt", order: "desc" }),
        listJobs()
      ]);

      startTransition(() => {
        setCandidates(candidateResponse.items);
        setJobs(jobResponse.items);
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const completedExtractions = candidates.filter((item) => item.extractionStatus === "completed").length;
    const scored = candidates.filter((item) => item.latestMatch);
    const averageScore = scored.length
      ? Math.round(scored.reduce((sum, item) => sum + (item.latestMatch?.overallScore ?? 0), 0) / scored.length)
      : 0;

    return {
      completedExtractions,
      averageScore
    };
  }, [candidates]);

  return (
    <Space direction="vertical" size={22} style={{ width: "100%" }}>
      <Card className="glass-card page-hero">
        <Typography.Text className="brand-kicker">Recruiting Intelligence</Typography.Text>
        <Typography.Title style={{ marginTop: 8, maxWidth: 720 }}>
          从 PDF 简历上传到 AI 提取、JD 评分和候选人决策，一条链路在同一控制台完成。
        </Typography.Title>
        <Typography.Paragraph className="soft-caption" style={{ maxWidth: 760, fontSize: 16 }}>
          首页负责批量处理与岗位配置，候选人面板负责筛选、对比和人工修正。支持拖拽上传、SSE 流式提取、可视化评分与状态管理。
        </Typography.Paragraph>
      </Card>

      <OverviewStrip
        totalCandidates={candidates.length}
        completedExtractions={metrics.completedExtractions}
        activeJobs={jobs.length}
        averageScore={metrics.averageScore}
      />

      <div className="dashboard-grid">
        <UploadWorkbench onUploaded={loadDashboard} />
        <JobConfigPanel jobs={jobs} candidates={candidates} onUpdated={loadDashboard} />
      </div>

      <RecentCandidates candidates={candidates} />

      {loading ? (
        <Typography.Text className="soft-caption">正在同步后端数据...</Typography.Text>
      ) : null}
    </Space>
  );
}
