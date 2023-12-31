import { Form, Input, Button, Row, Col } from 'antd';
import React from "react";
import axios from 'axios';
import { toast } from "react-hot-toast";

function PatientForm({ onFinish, initialValues }) {
  const handleFormSubmit = async (values) => {
    try {
      const formData = { ...values };
      const response = await axios.post('/api/doctor/update-patient-info', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        toast.success(response.data.message);
        // Invoke the callback to handle form submission
        onFinish(values);
      } else {
        toast.error("Error updating the patient information.");
      }
    } catch (error) {
      toast.error('Error updating patient information:', error.message);
    }
  };

  return (
    <Form
      layout="vertical"
      onFinish={handleFormSubmit}
      initialValues={{
        ...initialValues,
      }}
    >
    <h1 className="card-title mt-3">Personal Information</h1>
    <Row gutter={20}>
      <Col span={8} xs={24} sm={24} lg={8}>
        <Form.Item
          label="Patient Name"
          name="patientName"
          rules={[{ required: true, message: "Please enter First Name" }]}
        >
          <Input placeholder="Patient Name" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          label="Phone Number"
          name="patientNumber"
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
          name="patientEmail"
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
          name="patientDOB"
          rules={[
            { required: true, message: "Please select Date of Birth" },
          ]}
        >
          <Input placeholder="Date of Birth" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          label="Gender"
          name="patientGender"
          rules={[
            { message: "Please select gender" },
          ]}
        >
          {/* <Select placeholder="Select gender">
          <Option value="Male">Male</Option>
          <Option value="Female">Female</Option>
          <Option value="Other">Other</Option>
          <Option value="Prefer not to answer">Prefer not to answer</Option>
        </Select> */}
        <Input placeholder="Gender" />
        </Form.Item>
      </Col>
    </Row>
    <hr />
      <h1 className="card-title mt-3">Medical Information</h1>
      <Row gutter={20}>
      <Col span={8} xs={24} sm={24} lg={8}>
        <Form.Item
          label="Reason for Visit"
          name="reasonForVisit"
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
          name="dateofVisit"
          rules={[
            { required: true, message: "Please enter Date of Visit" },
          ]}
        >
          <Input placeholder="Date of Visit" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          label="Medical Conditions"
          name="medicalCondition"
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
          name="doctorName"
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
          name="doctorNumber"
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
          name="doctorWebsite"
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
          name="electronicSignature"
          rules={[
            { required: true, message: "Please provide your signature" },
          ]}
        >
          <Input placeholder="Signature" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          label="Date Signed"
          name="dateSigned"
          rules={[
            { required: true, message: "Please enter Date of Signature" },
          ]}
        >
          <Input placeholder="Date Signed" />
        </Form.Item>
      </Col>
    </Row>

      <div className="d-flex justify-content-end">
        <Button className="primary-button" htmlType="submit">
          SUBMIT
        </Button>
      </div>
    </Form>
  );
}

export default PatientForm;
