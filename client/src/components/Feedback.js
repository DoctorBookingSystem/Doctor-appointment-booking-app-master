import React, { useState } from "react";
import { Button, Col, Form, Input, Rate } from "antd";

function Feedback({ onFinish }) {
  const [wordCount, setWordCount] = useState(0);

  const handleTextChange = (e) => {
    const words = e.target.value.split(/\s+/);
    setWordCount(words.length);
  };

  return (
    <Form layout="vertical" onFinish={onFinish}>
      <Col span={12}>
      <Form.Item
        label="Doctor's Name"
        name="firstName"
        rules={[{ required: true, message: "Please enter doctor's name" }]}
      >
        <Input placeholder="Doctor Name" />
      </Form.Item>
      </Col>
      <Col span={12}>
      <Form.Item
        label="Date of Visit"
        name="date"
        rules={[{ required: true, message: "Please enter the date of visit" }]}
      >
        <Input type="date" placeholder="Date of Visit" />
      </Form.Item>
      </Col>
      <Form.Item
        label="Rating"
        name="rating"
        rules={[{ required: true, message: "Please provide a rating" }]}
      >
        <Rate allowHalf defaultValue={0} className="custom-rate" />
      </Form.Item>
      <Form.Item
        label="Please tell us about your experience with FIU Health Services."
        name="feedback"
        rules={[
          { required: false },
          { max: 200, message: "Feedback should be within 200 words" },
        ]}
      >
        <Input.TextArea
          placeholder="Write your feedback (max 200 words)"
          rows={4}
          onChange={handleTextChange}
        />
        <div style={{ marginTop: 8 }}>
          Word Count: {wordCount} / 200
        </div>
      </Form.Item>

      <Form.Item>
      <div className="d-flex justify-content-end">
        <Button type="primary" htmlType="submit">
          Submit Feedback
        </Button>
      </div>
      </Form.Item>
    </Form>
  );
}

export default Feedback;
