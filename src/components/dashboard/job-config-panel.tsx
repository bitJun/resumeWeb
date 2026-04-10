"use client";

import { useEffect, useMemo, useState } from "react";
import { App, Button, Card, Flex, Form, Input, Select, Space, Typography } from "antd";
import { DatabaseOutlined, SaveOutlined } from "@ant-design/icons";
import { CandidateRecord, JobDescriptionRecord } from "@/types/api";
import { createJob, scoreJobCandidates, updateJob } from "@/lib/api";
import { TagInput } from "@/components/shared/tag-input";

interface JobConfigPanelProps {
  jobs: JobDescriptionRecord[];
  candidates: CandidateRecord[];
  onUpdated: () => void;
}

interface JobFormValues {
  title: string;
  description: string;
  mustSkills: string[];
  bonusSkills: string[];
}

export function JobConfigPanel({ jobs, candidates, onUpdated }: JobConfigPanelProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<JobFormValues>();
  const [selectedJobId, setSelectedJobId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    if (!selectedJobId && jobs[0]) {
      setSelectedJobId(jobs[0].id);
      form.setFieldsValue(jobs[0]);
    }
  }, [jobs, selectedJobId, form]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId),
    [jobs, selectedJobId]
  );

  const syncForm = (jobId?: string) => {
    const target = jobs.find((item) => item.id === jobId);

    if (target) {
      form.setFieldsValue(target);
      setSelectedJobId(target.id);
    } else {
      form.resetFields();
      form.setFieldsValue({
        title: "",
        description: "",
        mustSkills: [],
        bonusSkills: []
      });
      setSelectedJobId(undefined);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (selectedJobId) {
        await updateJob(selectedJobId, values);
        message.success("岗位已更新。");
      } else {
        const created = await createJob(values);
        setSelectedJobId(created.id);
        message.success("岗位已创建。");
      }

      onUpdated();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleScoreAll = async () => {
    if (!selectedJobId) {
      message.warning("请先保存一个岗位。");
      return;
    }

    setScoring(true);

    try {
      const response = await scoreJobCandidates(selectedJobId);
      message.success(`已完成 ${response.items.length} 位候选人的岗位评分。`);
      onUpdated();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "评分失败");
    } finally {
      setScoring(false);
    }
  };

  return (
    <Card className="glass-card" title="JD 配置与批量评分">
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <Flex justify="space-between" gap={12} wrap="wrap">
          <Select
            value={selectedJobId}
            style={{ minWidth: 220 }}
            placeholder="选择已保存岗位"
            options={jobs.map((job) => ({ value: job.id, label: job.title }))}
            onChange={(value) => syncForm(value)}
          />
          <Button onClick={() => syncForm(undefined)}>新建岗位</Button>
        </Flex>

        <Form form={form} layout="vertical" initialValues={selectedJob}>
          <Form.Item name="title" label="岗位名称" rules={[{ required: true, message: "请输入岗位名称" }]}>
            <Input placeholder="例如：高级前端工程师 / AI 产品经理" />
          </Form.Item>
          <Form.Item
            name="description"
            label="岗位描述"
            rules={[{ required: true, message: "请输入岗位描述" }]}
          >
            <Input.TextArea rows={7} placeholder="输入岗位职责、业务背景、经验要求与关键产出。" />
          </Form.Item>
          <Form.Item name="mustSkills" label="必备技能">
            <TagInput placeholder="输入后按 Enter，例如 React、TypeScript、工程化" />
          </Form.Item>
          <Form.Item name="bonusSkills" label="加分技能">
            <TagInput placeholder="例如 OpenAI、设计系统、性能优化、数据分析" />
          </Form.Item>
        </Form>

        <Space wrap>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存岗位
          </Button>
          <Button icon={<DatabaseOutlined />} loading={scoring} onClick={handleScoreAll}>
            对全部候选人评分
          </Button>
        </Space>

        <Card size="small" style={{ background: "rgba(255,255,255,0.08)" }}>
          <Space direction="vertical" size={8}>
            <Typography.Text className="soft-caption">当前岗位概况</Typography.Text>
            <Typography.Text>
              已保存岗位 {jobs.length} 个，候选人库存 {candidates.length} 位。
            </Typography.Text>
            <Typography.Text>
              {selectedJob
                ? `当前岗位「${selectedJob.title}」将用于匹配评分和对比分析。`
                : "新建岗位后即可进行整库评分。"}
            </Typography.Text>
          </Space>
        </Card>
      </Space>
    </Card>
  );
}
