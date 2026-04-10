"use client";

import Link from "next/link";
import { Key, startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Drawer,
  Flex,
  Input,
  Pagination,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography
} from "antd";
import type { TableColumnsType } from "antd";
import { EyeOutlined, FilterOutlined, RadarChartOutlined } from "@ant-design/icons";
import { compareCandidates, listCandidates, listJobs, updateCandidateStatus } from "@/lib/api";
import { CandidateRecord, CandidateStatus, JobDescriptionRecord, MatchRecord } from "@/types/api";
import { formatDate, initials } from "@/lib/format";
import { StatusTag, candidateStatusOptions } from "@/components/shared/status-tag";

type ViewMode = "table" | "card";

export function CandidatesConsole() {
  const { message } = App.useApp();
  const [items, setItems] = useState<CandidateRecord[]>([]);
  const [jobs, setJobs] = useState<JobDescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<string>();
  const [skill, setSkill] = useState<string>();
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [selectedIds, setSelectedIds] = useState<Key[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareCandidatesData, setCompareCandidatesData] = useState<CandidateRecord[]>([]);
  const [compareMatchesData, setCompareMatchesData] = useState<MatchRecord[]>([]);
  const [compareJobId, setCompareJobId] = useState<string>();

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const [candidateResponse, jobResponse] = await Promise.all([
        listCandidates({
          page,
          pageSize,
          q: deferredSearch,
          status,
          skill,
          sortBy,
          order: "desc"
        }),
        listJobs()
      ]);

      startTransition(() => {
        setItems(candidateResponse.items);
        setTotal(candidateResponse.pagination.total);
        setJobs(jobResponse.items);
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "候选人加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidates();
  }, [page, pageSize, deferredSearch, status, skill, sortBy]);

  const availableSkills = useMemo(
    () =>
      Array.from(new Set(items.flatMap((candidate) => candidate.extraction.skills)))
        .filter(Boolean)
        .slice(0, 30),
    [items]
  );

  const handleStatusChange = async (candidateId: string, nextStatus: CandidateStatus) => {
    try {
      const updated = await updateCandidateStatus(candidateId, nextStatus);
      setItems((current) => current.map((item) => (item.id === candidateId ? updated : item)));
      message.success("候选人状态已更新。");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "状态更新失败");
    }
  };

  const openCompare = async () => {
    if (selectedIds.length < 2 || selectedIds.length > 3) {
      message.warning("请选择 2-3 位候选人进行对比。");
      return;
    }

    try {
      const response = await compareCandidates(
        selectedIds.map(String),
        compareJobId
      );
      setCompareCandidatesData(response.candidates);
      setCompareMatchesData(response.matches);
      setCompareOpen(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "对比数据加载失败");
    }
  };

  const columns: TableColumnsType<CandidateRecord> = [
    {
      title: "候选人",
      dataIndex: "candidate",
      render: (_value, record) => (
        <Space>
          <Avatar style={{ background: "#bf5b31" }}>{initials(record.extraction.basicInfo.name)}</Avatar>
          <Space direction="vertical" size={2}>
            <Typography.Text strong>{record.extraction.basicInfo.name || record.originalName}</Typography.Text>
            <Typography.Text className="soft-caption">{record.extraction.basicInfo.email || "邮箱待识别"}</Typography.Text>
          </Space>
        </Space>
      )
    },
    {
      title: "技能标签",
      dataIndex: "skills",
      render: (_value, record) => (
        <Space wrap>
          {record.extraction.skills.slice(0, 4).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: "评分",
      dataIndex: "latestMatch",
      render: (_value, record) => (record.latestMatch ? `${record.latestMatch.overallScore} / 100` : "待评分")
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (value, record) => (
        <Select
          value={value}
          options={candidateStatusOptions}
          style={{ minWidth: 120 }}
          onChange={(next) => void handleStatusChange(record.id, next as CandidateStatus)}
        />
      )
    },
    {
      title: "上传时间",
      dataIndex: "uploadedAt",
      render: (value) => formatDate(value)
    },
    {
      title: "操作",
      dataIndex: "actions",
      render: (_value, record) => (
        <Link href={`/candidates/${record.id}`}>
          <Button icon={<EyeOutlined />}>详情</Button>
        </Link>
      )
    }
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Card className="glass-card page-hero">
        <Typography.Text className="brand-kicker">Talent Review Center</Typography.Text>
        <Typography.Title style={{ marginTop: 8 }}>候选人管理与多维对比面板</Typography.Title>
        <Typography.Paragraph className="soft-caption" style={{ maxWidth: 720 }}>
          支持关键字搜索、按评分和技能过滤、表格/卡片切换、状态流转，以及 2-3 位候选人的并排对比分析。
        </Typography.Paragraph>
      </Card>

      <Card className="glass-card">
        <Flex justify="space-between" gap={16} wrap="wrap">
          <Space wrap>
            <Input
              id="candidate-search"
              allowClear
              prefix={<FilterOutlined />}
              placeholder="搜索姓名、学校、技能、邮箱"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              style={{ width: 280 }}
            />
            <Select
              allowClear
              placeholder="筛选状态"
              value={status}
              style={{ width: 150 }}
              options={candidateStatusOptions}
              onChange={(value) => {
                setPage(1);
                setStatus(value);
              }}
            />
            <Select
              allowClear
              showSearch
              placeholder="筛选技能"
              value={skill}
              style={{ width: 180 }}
              options={availableSkills.map((value) => ({ value, label: value }))}
              onChange={(value) => {
                setPage(1);
                setSkill(value);
              }}
            />
            <Select
              value={sortBy}
              style={{ width: 140 }}
              options={[
                { value: "uploadedAt", label: "按上传时间" },
                { value: "score", label: "按评分" },
                { value: "name", label: "按姓名" }
              ]}
              onChange={(value) => setSortBy(value)}
            />
          </Space>

          <Space wrap>
            <Select
              allowClear
              placeholder="对比指定岗位"
              value={compareJobId}
              style={{ width: 200 }}
              options={jobs.map((job) => ({ value: job.id, label: job.title }))}
              onChange={(value) => setCompareJobId(value)}
            />
            <Button icon={<RadarChartOutlined />} onClick={openCompare}>
              对比所选候选人
            </Button>
            <Segmented<ViewMode>
              value={viewMode}
              onChange={(value) => setViewMode(value)}
              options={[
                { value: "table", label: "表格视图" },
                { value: "card", label: "卡片视图" }
              ]}
            />
          </Space>
        </Flex>
      </Card>

      {viewMode === "table" ? (
        <Card className="glass-card">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            columns={columns}
            pagination={false}
            rowSelection={{
              selectedRowKeys: selectedIds,
              onChange: setSelectedIds
            }}
          />
        </Card>
      ) : (
        <div className="candidate-grid">
          {items.map((candidate) => {
            const selected = selectedIds.includes(candidate.id);
            return (
              <Card
                key={candidate.id}
                className="glass-card"
                actions={[
                  <Button
                    key="select"
                    type={selected ? "primary" : "default"}
                    onClick={() =>
                      setSelectedIds((current) =>
                        current.includes(candidate.id)
                          ? current.filter((item) => item !== candidate.id)
                          : [...current, candidate.id].slice(-3)
                      )
                    }
                  >
                    {selected ? "已选择" : "加入对比"}
                  </Button>,
                  <Link key="detail" href={`/candidates/${candidate.id}`}>
                    详情
                  </Link>
                ]}
              >
                <Space direction="vertical" style={{ width: "100%" }} size={10}>
                  <Flex justify="space-between" align="center">
                    <Space>
                      <Avatar style={{ background: "#bf5b31" }}>{initials(candidate.extraction.basicInfo.name)}</Avatar>
                      <div>
                        <Typography.Title level={5} style={{ margin: 0 }}>
                          {candidate.extraction.basicInfo.name || candidate.originalName}
                        </Typography.Title>
                        <Typography.Text className="soft-caption">
                          {candidate.extraction.basicInfo.city || "城市待识别"}
                        </Typography.Text>
                      </div>
                    </Space>
                    <StatusTag status={candidate.status} />
                  </Flex>
                  <Space wrap>
                    {candidate.extraction.skills.slice(0, 5).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                  <Typography.Text>
                    匹配评分：{candidate.latestMatch ? `${candidate.latestMatch.overallScore} / 100` : "待评分"}
                  </Typography.Text>
                  <Typography.Text className="soft-caption">上传于 {formatDate(candidate.uploadedAt)}</Typography.Text>
                </Space>
              </Card>
            );
          })}
        </div>
      )}

      <Flex justify="end">
        <Pagination current={page} pageSize={pageSize} total={total} onChange={setPage} showSizeChanger={false} />
      </Flex>

      <Drawer
        title="候选人对比"
        placement="right"
        width={760}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      >
        <div className="compare-grid">
          {compareCandidatesData.map((candidate) => {
            const match =
              compareMatchesData.find((item) => item.candidateId === candidate.id) ?? candidate.latestMatch ?? null;
            return (
              <Card key={candidate.id} className="surface-panel">
                <Space direction="vertical" style={{ width: "100%" }} size={10}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {candidate.extraction.basicInfo.name || candidate.originalName}
                  </Typography.Title>
                  <StatusTag status={candidate.status} />
                  <Typography.Text>
                    综合评分：<strong>{match?.overallScore ?? "-"}</strong>
                  </Typography.Text>
                  <Typography.Text>技能分：{match?.skillScore ?? "-"}</Typography.Text>
                  <Typography.Text>经验分：{match?.experienceScore ?? "-"}</Typography.Text>
                  <Typography.Text>教育分：{match?.educationScore ?? "-"}</Typography.Text>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>
                    {match?.aiComment || "暂无评分说明"}
                  </Typography.Paragraph>
                </Space>
              </Card>
            );
          })}
        </div>
      </Drawer>
    </Space>
  );
}
