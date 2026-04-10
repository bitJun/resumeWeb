"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Card, Col, Progress, Row, Space, Typography, Upload, UploadFile } from "antd";
import { CloudUploadOutlined, RocketOutlined } from "@ant-design/icons";
import { CandidateRecord } from "@/types/api";
import { formatFileSize } from "@/lib/format";
import { streamCandidateExtraction, uploadCandidates } from "@/lib/api";

interface UploadWorkbenchProps {
  onUploaded: () => void;
}

interface LiveExtractionState {
  candidate: CandidateRecord;
  progress: number;
  label: string;
  sections: Partial<CandidateRecord["extraction"]>;
}

type ExtractionStreamHandle = {
  close: () => void;
};

export function UploadWorkbench({ onUploaded }: UploadWorkbenchProps) {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [liveState, setLiveState] = useState<Record<string, LiveExtractionState>>({});
  const previewFile = fileList[0]?.originFileObj as File | undefined;
  const previewUrlRef = useRef<string>("");
  const eventSourcesRef = useRef<Record<string, ExtractionStreamHandle>>({});
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl("");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const url = URL.createObjectURL(previewFile);
    previewUrlRef.current = url;
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [previewFile]);

  useEffect(() => {
    return () => {
      Object.values(eventSourcesRef.current).forEach((source) => source.close());
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const selectedSummary = useMemo(
    () => ({
      count: fileList.length,
      totalSize: fileList.reduce((sum, file) => sum + Number(file.size ?? 0), 0)
    }),
    [fileList]
  );

  const handleUpload = async () => {
    const files = fileList
      .map((file) => file.originFileObj as File | undefined)
      .filter((file): file is File => Boolean(file));

    if (!files.length) {
      message.warning("请先选择至少一份 PDF 简历。");
      return;
    }

    setUploading(true);
    setBatchProgress(0);

    try {
      const response = await uploadCandidates(files, setBatchProgress);
      const sessions = Object.fromEntries(
        response.items.map((candidate) => [
          candidate.id,
          {
            candidate,
            progress: 5,
            label: "上传完成，等待解析",
            sections: {}
          }
        ])
      );
      setLiveState((current) => ({ ...current, ...sessions }));
      setFileList([]);
      message.success(`已上传 ${response.items.length} 份简历，开始流式提取。`);

      response.items.forEach((candidate) => {
        const source = streamCandidateExtraction(candidate.id, {
          onStatus: (payload) => {
            const data = payload as { progress?: number; label?: string };
            setLiveState((current) => ({
              ...current,
              [candidate.id]: {
                ...(current[candidate.id] ?? sessions[candidate.id]),
                progress: data.progress ?? current[candidate.id]?.progress ?? 0,
                label: data.label ?? current[candidate.id]?.label ?? ""
              }
            }));
          },
          onSection: (payload) => {
            const data = payload as {
              progress: number;
              label: string;
              section: keyof CandidateRecord["extraction"];
              payload: unknown;
            };

            setLiveState((current) => ({
              ...current,
              [candidate.id]: {
                ...(current[candidate.id] ?? sessions[candidate.id]),
                progress: data.progress,
                label: data.label,
                sections: {
                  ...(current[candidate.id]?.sections ?? {}),
                  [data.section]: data.payload
                }
              }
            }));
          },
          onDone: (payload) => {
            delete eventSourcesRef.current[candidate.id];
            setLiveState((current) => ({
              ...current,
              [candidate.id]: {
                candidate: payload.candidate,
                progress: 100,
                label: "提取完成",
                sections: payload.candidate.extraction
              }
            }));
            onUploaded();
          },
          onError: (error) => {
            delete eventSourcesRef.current[candidate.id];
            setLiveState((current) => ({
              ...current,
              [candidate.id]: {
                ...(current[candidate.id] ?? sessions[candidate.id]),
                label: error,
                progress: current[candidate.id]?.progress ?? 0
              }
            }));
            message.error(error);
          }
        });

        eventSourcesRef.current[candidate.id] = source;
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="glass-card" title="批量上传与实时解析工作台">
      <Row gutter={[18, 18]}>
        <Col xs={24} lg={15}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Upload.Dragger
              multiple
              accept=".pdf,application/pdf"
              fileList={fileList}
              beforeUpload={(file) => {
                if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
                  message.error("仅支持 PDF 简历。");
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
              onChange={(info) => setFileList(info.fileList.slice(-10))}
              style={{ paddingBlock: 18 }}
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ color: "#bf5b31" }} />
              </p>
              <Typography.Title level={4}>拖拽 PDF 到此处，或点击选择文件</Typography.Title>
              <Typography.Paragraph className="soft-caption" style={{ marginBottom: 0 }}>
                支持一次上传 5-10 份简历，系统会自动完成解析、结构化提取并更新候选人库。
              </Typography.Paragraph>
            </Upload.Dragger>

            <Card size="small">
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <Typography.Text>
                  已选择 {selectedSummary.count} 份文件，总大小 {formatFileSize(selectedSummary.totalSize)}
                </Typography.Text>
                {uploading || batchProgress > 0 ? <Progress percent={batchProgress} status="active" /> : null}
                <Space wrap>
                  <Button type="primary" icon={<RocketOutlined />} loading={uploading} onClick={handleUpload}>
                    开始批量上传
                  </Button>
                  <Button onClick={() => setFileList([])} disabled={uploading || !fileList.length}>
                    清空列表
                  </Button>
                </Space>
              </Space>
            </Card>
          </Space>
        </Col>
        <Col xs={24} lg={9}>
          <Card size="small" title="当前选中文件预览">
            {previewUrl ? (
              <object className="pdf-preview" data={previewUrl} type="application/pdf">
                PDF 预览不可用
              </object>
            ) : (
              <Typography.Paragraph className="soft-caption" style={{ marginBottom: 0 }}>
                选择文件后，这里会显示当前 PDF 的浏览器预览。
              </Typography.Paragraph>
            )}
          </Card>
        </Col>
      </Row>

      <Space direction="vertical" size={14} style={{ width: "100%", marginTop: 22 }}>
        <Typography.Title level={5} style={{ marginBottom: 0 }}>
          流式提取结果
        </Typography.Title>
        <div className="candidate-grid">
          {Object.values(liveState)
            .sort((a, b) => b.candidate.uploadedAt.localeCompare(a.candidate.uploadedAt))
            .map((item) => (
              <Card key={item.candidate.id} size="small" className="surface-panel">
                <Space direction="vertical" style={{ width: "100%" }} size={10}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {item.sections.basicInfo?.name || item.candidate.originalName}
                  </Typography.Title>
                  <Progress percent={item.progress} size="small" status={item.progress >= 100 ? "success" : "active"} />
                  <Typography.Text className="soft-caption">{item.label}</Typography.Text>
                  <Typography.Text>
                    {item.sections.basicInfo?.email || "邮箱待识别"} / {item.sections.basicInfo?.city || "城市待识别"}
                  </Typography.Text>
                  <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                    技能标签：{item.sections.skills?.join("、") || "等待提取"}
                  </Typography.Paragraph>
                </Space>
              </Card>
            ))}
        </div>
      </Space>
    </Card>
  );
}
