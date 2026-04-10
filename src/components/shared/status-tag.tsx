"use client";

import { Tag } from "antd";
import { CandidateStatus } from "@/types/api";

const STATUS_META: Record<CandidateStatus, { label: string; color: string }> = {
  pending: { label: "待筛选", color: "default" },
  shortlisted: { label: "初筛通过", color: "processing" },
  interviewing: { label: "面试中", color: "warning" },
  hired: { label: "已录用", color: "success" },
  rejected: { label: "已淘汰", color: "error" }
};

export function StatusTag({ status }: { status: CandidateStatus }) {
  const meta = STATUS_META[status];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

export const candidateStatusOptions = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label
}));
