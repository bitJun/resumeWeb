"use client";

import { Button, Result } from "antd";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Result
      status="500"
      title="页面加载失败"
      subTitle={error.message || "发生了未预期的错误，请重试。"}
      extra={
        <Button type="primary" onClick={reset}>
          重新加载
        </Button>
      }
    />
  );
}
