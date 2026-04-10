"use client";

import { useState } from "react";
import { Button, Input, Space, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface TagInputProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value = [], onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const next = draft.trim();
    if (!next || value.includes(next)) {
      setDraft("");
      return;
    }
    onChange?.([...value, next]);
    setDraft("");
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={10}>
      <Space wrap>
        {value.map((tag) => (
          <Tag
            key={tag}
            closable
            style={{ paddingInline: 10, borderRadius: 999 }}
            onClose={() => onChange?.(value.filter((item) => item !== tag))}
          >
            {tag}
          </Tag>
        ))}
      </Space>
      <Space.Compact style={{ width: "100%" }}>
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onPressEnter={addTag}
        />
        <Button icon={<PlusOutlined />} onClick={addTag}>
          添加
        </Button>
      </Space.Compact>
    </Space>
  );
}
