"use client";

import Link from "next/link";
import { Avatar, Button, Card, Flex, List, Space, Tag, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { CandidateRecord } from "@/types/api";
import { formatDate, initials } from "@/lib/format";
import { StatusTag } from "@/components/shared/status-tag";

export function RecentCandidates({ candidates }: { candidates: CandidateRecord[] }) {
  const items = [...candidates]
    .sort((a, b) => (b.latestMatch?.overallScore ?? 0) - (a.latestMatch?.overallScore ?? 0))
    .slice(0, 5);

  return (
    <Card
      className="glass-card"
      title="优先关注候选人"
      extra={
        <Link href="/candidates">
          <Button type="link" icon={<ArrowRightOutlined />}>
            查看全部
          </Button>
        </Link>
      }
    >
      <List
        itemLayout="horizontal"
        dataSource={items}
        locale={{ emptyText: "上传简历后，这里会展示优先复核候选人。" }}
        renderItem={(candidate) => (
          <List.Item
            actions={[
              <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
                详情
              </Link>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar style={{ background: "#bf5b31" }}>{initials(candidate.extraction.basicInfo.name)}</Avatar>}
              title={candidate.extraction.basicInfo.name || candidate.originalName}
              description={
                <Space direction="vertical" size={4}>
                  <Space wrap>
                    <StatusTag status={candidate.status} />
                    <Tag>{candidate.extraction.basicInfo.city || "城市待识别"}</Tag>
                    {candidate.latestMatch ? <Tag color="gold">匹配度 {candidate.latestMatch.overallScore}</Tag> : null}
                  </Space>
                  <Typography.Text className="soft-caption">
                    上传时间：{formatDate(candidate.uploadedAt)}
                  </Typography.Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
      {items[0]?.latestMatch ? (
        <Card size="small" style={{ marginTop: 16, background: "rgba(255,255,255,0.12)" }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <div>
              <Typography.Text className="soft-caption">当前最高分</Typography.Text>
              <Typography.Title level={4} style={{ margin: "6px 0 0" }}>
                {items[0].extraction.basicInfo.name || items[0].originalName}
              </Typography.Title>
            </div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {items[0].latestMatch.overallScore}
            </Typography.Title>
          </Flex>
        </Card>
      ) : null}
    </Card>
  );
}
