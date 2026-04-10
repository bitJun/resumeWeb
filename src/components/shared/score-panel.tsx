"use client";

import { Card, Flex, List, Progress, Space, Statistic, Typography } from "antd";
import { MatchRecord } from "@/types/api";

export function ScorePanel({ match }: { match: MatchRecord | null }) {
  if (!match) {
    return (
      <Card className="glass-card">
        <Typography.Title level={4} className="section-title">
          岗位匹配评分
        </Typography.Title>
        <Typography.Paragraph className="soft-caption" style={{ marginBottom: 0 }}>
          还没有评分结果。先在岗位面板中配置 JD 并执行评分。
        </Typography.Paragraph>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <Flex justify="space-between" gap={24} wrap="wrap">
        <Space size={20} wrap>
          <Progress
            type="circle"
            size={132}
            percent={match.overallScore}
            strokeColor={{ "0%": "#e4a11b", "100%": "#bf5b31" }}
          />
          <Statistic title="综合匹配度" value={match.overallScore} suffix="/ 100" />
        </Space>
        <Space direction="vertical" style={{ flex: 1, minWidth: 280 }} size={12}>
          <Typography.Text>技能匹配度</Typography.Text>
          <Progress percent={match.skillScore} strokeColor="#bf5b31" />
          <Typography.Text>经验相关性</Typography.Text>
          <Progress percent={match.experienceScore} strokeColor="#2f9e78" />
          <Typography.Text>教育背景契合度</Typography.Text>
          <Progress percent={match.educationScore} strokeColor="#e4a11b" />
        </Space>
      </Flex>
      <Typography.Paragraph style={{ marginTop: 20 }}>{match.aiComment}</Typography.Paragraph>
      <List
        size="small"
        header="技能拆解"
        dataSource={[
          `命中必备技能：${match.breakdown.matchedMustSkills.join("、") || "暂无"}`,
          `命中加分技能：${match.breakdown.matchedBonusSkills.join("、") || "暂无"}`,
          `缺失必备技能：${match.breakdown.missingMustSkills.join("、") || "暂无"}`
        ]}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    </Card>
  );
}
