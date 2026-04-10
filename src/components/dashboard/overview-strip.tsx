"use client";

import { Card, Col, Row, Statistic, Typography } from "antd";

interface OverviewStripProps {
  totalCandidates: number;
  completedExtractions: number;
  activeJobs: number;
  averageScore: number;
}

export function OverviewStrip({
  totalCandidates,
  completedExtractions,
  activeJobs,
  averageScore
}: OverviewStripProps) {
  const items = [
    {
      title: "候选人总量",
      value: totalCandidates,
      suffix: "份",
      tone: "rgba(191, 91, 49, 0.1)"
    },
    {
      title: "已完成解析",
      value: completedExtractions,
      suffix: "份",
      tone: "rgba(47, 158, 120, 0.12)"
    },
    {
      title: "已保存岗位",
      value: activeJobs,
      suffix: "个",
      tone: "rgba(228, 161, 27, 0.14)"
    },
    {
      title: "平均匹配分",
      value: averageScore,
      suffix: "/100",
      tone: "rgba(24, 119, 242, 0.12)"
    }
  ];

  return (
    <Row gutter={[18, 18]}>
      {items.map((item) => (
        <Col xs={24} sm={12} xl={6} key={item.title}>
          <Card className="glass-card metric-card fade-in-up" style={{ background: item.tone }}>
            <Typography.Text className="soft-caption">{item.title}</Typography.Text>
            <Statistic value={item.value} suffix={item.suffix} style={{ marginTop: 10 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
