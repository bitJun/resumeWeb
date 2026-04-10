import { Card, Col, Row, Skeleton, Space } from "antd";

export default function Loading() {
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Skeleton active paragraph={{ rows: 2 }} />
      <Row gutter={[20, 20]}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Col xs={24} lg={8} key={index}>
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
