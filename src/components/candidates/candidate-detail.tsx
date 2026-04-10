"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Typography
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  API_BASE_URL,
  getCandidate,
  listJobs,
  scoreCandidate,
  updateCandidateExtraction,
  updateCandidateStatus
} from "@/lib/api";
import { formatDate, formatFileSize } from "@/lib/format";
import { CandidateRecord, CandidateStatus, JobDescriptionRecord, ResumeExtraction } from "@/types/api";
import { candidateStatusOptions, StatusTag } from "@/components/shared/status-tag";
import { TagInput } from "@/components/shared/tag-input";
import { ScorePanel } from "@/components/shared/score-panel";

export function CandidateDetail({ candidateId }: { candidateId: string }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ResumeExtraction>();
  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [jobs, setJobs] = useState<JobDescriptionRecord[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const [candidateData, jobResponse] = await Promise.all([getCandidate(candidateId), listJobs()]);

      startTransition(() => {
        setCandidate(candidateData);
        setJobs(jobResponse.items);
        setSelectedJobId(candidateData.latestMatch?.jobId ?? jobResponse.items[0]?.id);
        form.setFieldsValue(candidateData.extraction);
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "候选人详情加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [candidateId]);

  const currentMatch = useMemo(
    () => {
      if (!candidate) {
        return null;
      }

      return (
        candidate.matches.find((item) => item.jobId === selectedJobId) ??
        (candidate.latestMatch && candidate.latestMatch.jobId === selectedJobId ? candidate.latestMatch : null) ??
        candidate.latestMatch ??
        null
      );
    },
    [candidate, selectedJobId]
  );

  const handleSaveExtraction = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const updated = await updateCandidateExtraction(candidateId, values);
      setCandidate(updated);
      message.success("提取结果已更新。");
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: CandidateStatus) => {
    try {
      const updated = await updateCandidateStatus(candidateId, status);
      setCandidate(updated);
      message.success("状态已更新。");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "状态更新失败");
    }
  };

  const handleScore = async () => {
    if (!selectedJobId) {
      message.warning("请先选择一个岗位。");
      return;
    }

    setScoring(true);

    try {
      await scoreCandidate(candidateId, selectedJobId);
      await loadDetail();
      message.success("已重新完成岗位评分。");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "评分失败");
    } finally {
      setScoring(false);
    }
  };

  if (loading || !candidate) {
    return (
      <Flex justify="center" style={{ paddingBlock: 80 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <Space direction="vertical" size={22} style={{ width: "100%" }}>
      <Card className="glass-card">
        <Flex justify="space-between" align="start" gap={16} wrap="wrap">
          <div>
            <Link href="/candidates">返回候选人面板</Link>
            <Typography.Title level={2} style={{ margin: "10px 0 6px" }}>
              {candidate.extraction.basicInfo.name || candidate.originalName}
            </Typography.Title>
            <Space wrap>
              <StatusTag status={candidate.status} />
              <Typography.Text className="soft-caption">上传于 {formatDate(candidate.uploadedAt)}</Typography.Text>
            </Space>
          </div>
          <Space wrap>
            <Select
              value={candidate.status}
              style={{ minWidth: 150 }}
              options={candidateStatusOptions}
              onChange={(value) => void handleStatusChange(value as CandidateStatus)}
            />
            <Select
              allowClear
              placeholder="选择岗位"
              value={selectedJobId}
              style={{ minWidth: 220 }}
              options={jobs.map((job) => ({ value: job.id, label: job.title }))}
              onChange={(value) => setSelectedJobId(value)}
            />
            <Button type="primary" loading={scoring} onClick={handleScore}>
              重新评分
            </Button>
          </Space>
        </Flex>
      </Card>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={16}>
          <ScorePanel match={currentMatch} />
        </Col>
        <Col xs={24} xl={8}>
          <Card className="glass-card" title="候选人元数据">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="原始文件">{candidate.originalName}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{formatFileSize(candidate.fileSize)}</Descriptions.Item>
              <Descriptions.Item label="页数">{candidate.pageCount}</Descriptions.Item>
              <Descriptions.Item label="解析状态">{candidate.extractionStatus}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{candidate.extraction.basicInfo.email || "-"}</Descriptions.Item>
              <Descriptions.Item label="电话">{candidate.extraction.basicInfo.phone || "-"}</Descriptions.Item>
              <Descriptions.Item label="城市">{candidate.extraction.basicInfo.city || "-"}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={15}>
          <Card
            className="glass-card"
            title="人工校正提取信息"
            extra={
              <Button type="primary" loading={saving} onClick={handleSaveExtraction}>
                保存修改
              </Button>
            }
          >
            <Form form={form} layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item name={["basicInfo", "name"]} label="姓名">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["basicInfo", "city"]} label="所在城市">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["basicInfo", "phone"]} label="电话">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["basicInfo", "email"]} label="邮箱">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">教育背景</Divider>
              <Form.List name="educations">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={14}>
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        extra={
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                        }
                      >
                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item name={[field.name, "school"]} label="学校">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name={[field.name, "major"]} label="专业">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name={[field.name, "degree"]} label="学历">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name={[field.name, "graduationTime"]} label="毕业时间">
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={() => add({ school: "", major: "", degree: "", graduationTime: "" })}>
                      新增教育经历
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Divider orientation="left">工作经历</Divider>
              <Form.List name="experiences">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={14}>
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        extra={
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                        }
                      >
                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item name={[field.name, "companyName"]} label="公司名称">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item name={[field.name, "title"]} label="职位">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item name={[field.name, "period"]} label="时间段">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item name={[field.name, "summary"]} label="工作内容摘要">
                              <Input.TextArea rows={4} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => add({ companyName: "", title: "", period: "", summary: "" })}
                    >
                      新增工作经历
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Divider orientation="left">技能标签</Divider>
              <Form.Item name="skills">
                <TagInput placeholder="新增技能标签，例如 TypeScript、Prompt Engineering" />
              </Form.Item>

              <Divider orientation="left">项目经历</Divider>
              <Form.List name="projects">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={14}>
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        extra={
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                        }
                      >
                        <Row gutter={12}>
                          <Col xs={24}>
                            <Form.Item name={[field.name, "name"]} label="项目名称">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item name={[field.name, "techStack"]} label="技术栈">
                              <TagInput placeholder="例如 Next.js、Express、OpenAI" />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item name={[field.name, "responsibility"]} label="个人职责">
                              <Input.TextArea rows={3} />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item name={[field.name, "highlights"]} label="项目亮点">
                              <Input.TextArea rows={3} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => add({ name: "", techStack: [], responsibility: "", highlights: "" })}
                    >
                      新增项目经历
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card className="glass-card" title="原始 PDF 预览">
            <iframe
              className="pdf-preview"
              src={`${API_BASE_URL}${candidate.fileUrl}`}
              title={`${candidate.originalName} preview`}
            />
          </Card>
          <Card className="glass-card" title="原始文本摘要" style={{ marginTop: 20 }}>
            <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
              {candidate.cleanText.slice(0, 1800) || "未提取到文本。"}
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
