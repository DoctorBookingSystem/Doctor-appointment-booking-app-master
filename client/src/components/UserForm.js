import { Button, Col, Form, Input, Row} from "antd";
import React from "react";

function UserForm({ onFinish, initivalValues }) {
    return (
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          ...initivalValues,
          ...(initivalValues && {
          }),
        }}
      >
        <h1 className="card-title mt-3">Personal Information</h1>
        <Row gutter={20}>
          <Col span={8} xs={24} sm={24} lg={8}>
            <Form.Item
              required
              label="Name"
              name="name"
              rules={[{ required: true }]}
            >
              <Input placeholder="Name"/>
            </Form.Item>
          </Col>
          <Col span={8} xs={24} sm={24} lg={8}>
            <Form.Item
              required
              label="Phone Number"
              name="phoneNumber"
              rules={[{ required: true }]}
            >
              <Input placeholder="Phone Number" />
            </Form.Item>
          </Col>
          <Col span={8} xs={24} sm={24} lg={8}>
            <Form.Item
              required
              label="Email"
              name="email"
              rules={[{ required: true }]}
            >
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
        </Row>
        <hr />
        
  
        <div className="d-flex justify-content-end">
          <Button className="primary-button" htmlType="submit">
            UPDATE
          </Button>
        </div>
      </Form>
    );
  }
  
  export default UserForm;
  