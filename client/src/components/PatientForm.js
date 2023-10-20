import React from "react";
import { Button, Col, Form, Input, Row, Select } from "antd";
//import SignatureCanvas from "react-signature-canvas";

const { Option } = Select;

function PatientForm({ onFinish, initialValues }) {
  //const signatureRef = useRef();

  return (
    <Form layout="vertical" onFinish={onFinish} initialValues={initialValues}>
      <h1 className="card-title mt-3">Personal Information</h1>
      <Row gutter={20}>
        <Col span={8} xs={24} sm={24} lg={8}>
          <Form.Item
            label="Patient Name"
            name="name"
            rules={[{ required: true, message: "Please enter First Name" }]}
          >
            <Input placeholder="Patient Name" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[
              { required: true, message: "Please enter Phone Number" },
              {
                message: "Please enter a valid 10-digit Phone Number",
              },
            ]}
          >
            <Input placeholder="Phone Number" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter Email" },
              { type: "email", message: "Please enter a valid Email" },
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Date of Birth"
            name="dob"
            rules={[
              { required: true, message: "Please select Date of Birth" },
            ]}
          >
            <Input placeholder="Date of Birth" type="date" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Gender"
            name="gender"
            rules={[
              { message: "Please select gender" },
            ]}
          >
            <Select placeholder="Select gender">
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
            <Option value="Other">Other</Option>
            <Option value="Prefer not to answer">Prefer not to answer</Option>
          </Select>
          </Form.Item>
        </Col>
      </Row>
      <hr />
        <h1 className="card-title mt-3">Medical Information</h1>
        <Row gutter={20}>
        <Col span={8} xs={24} sm={24} lg={8}>
          <Form.Item
            label="Reason for Visit"
            name="reasonvisit"
            rules={[
              { required: true, message: "Please enter Reason for Visit" },
            ]}
          >
            <Input placeholder="Reason for Visit" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Date of Visit"
            name="date"
            rules={[
              { required: true, message: "Please enter Date of Visit" },
            ]}
          >
            <Input placeholder="Date" type="date" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Medical Conditions"
            name="medicalConditions"
            rules={[
              { required: true, message: "Please enter Medical Conditions" },
            ]}
          >
            <Input placeholder="Medical Conditions" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Allergies"
            name="allergies"
            rules={[{ required: true, message: "Please enter Allergies" }]}
          >
            <Input placeholder="Allergies" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Prescribed Medications"
            name="medications"
            rules={[
              {
                required: true,
                message: "Please enter Prescribed Medications",
              },
            ]}
          >
            <Input placeholder="Prescribed Medications" />
          </Form.Item>
        </Col>
       </Row>
       <hr />
        <h1 className="card-title mt-3">Doctor's Information</h1>
        <Row gutter={20}>
        <Col span={8} xs={24} sm={24} lg={8}>
          <Form.Item
            label="Doctor Name"
            name="firstName"
            rules={[
              { required: true, message: "Please enter Doctor's Name" },
            ]}
          >
            <Input placeholder="Doctor Name" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Doctor Phone Number"
            name="phoneNumber"
            rules={[
              {
                required: true,
                message: "Please enter Doctor's Phone Number",
              },
              {
                message: "Please enter a valid 10-digit Phone Number",
              },
            ]}
          >
            <Input placeholder="Doctor Phone Number" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Doctor Website"
            name="website"
            rules={[
              { required: true, message: "Please enter Doctor's Website" },
            ]}
          >
            <Input placeholder="Doctor Website" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Electronic Signature"
            name="name"
            rules={[
              { required: true, message: "Please provide your signature" },
            ]}
          >
            {/* <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: 400,
                height: 200,
                className: "signature-canvas",
              }}
            /> */}
            <Input placeholder="Signature" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Date Signed"
            name="date"
            rules={[
              { required: true, message: "Please enter Date of Signature" },
            ]}
          >
            <Input placeholder="Date" type="date" />
          </Form.Item>
        </Col>
      </Row>

      <div className="d-flex justify-content-end">
        {/* <Button className="primary-button" onClick={() => signatureRef.current.clear()}>
          Clear Signature
        </Button> */}
        <Button className="primary-button" htmlType="submit">
          SUBMIT
        </Button>
      </div>
    </Form>
  );
}

export default PatientForm;
