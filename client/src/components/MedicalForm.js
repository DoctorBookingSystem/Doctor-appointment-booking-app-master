import { Form, Input, Radio, Button, Row, Col } from 'antd';
import React from "react";
import axios from 'axios';
import { toast } from "react-hot-toast";

function MedicalForm({ onFinish, initialValues }) {

  const handleFormSubmit = async (values) => {

    try {
      const userId = initialValues._id;
      const formData = { ...values, userId };
      const response = await axios.post('/api/user/updatePatientInfo', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.status === 201) {
        toast.success(response.data.message);
        window.location.reload();
      } else {
        console.error("Error updating the patients info.");
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  return (
    <Form
      layout="vertical"
      onFinish={handleFormSubmit}
       initialValues={{
         ...initialValues,
    //     ...(initivalValues && {
    //       timings: [
    //         moment(initivalValues?.timings[0], "h:mm a"),
    //         moment(initivalValues?.timings[1], "h:mm a"),
    //       ],
    //     })
       }}
    >
      <h1 className="card-title mt-3">Personal Information</h1>
      <Row gutter={20}>
        <Col span={8} xs={24} sm={12} lg={8}>
          <Form.Item 
            label="Phone Number" 
            name="phoneNumber"
            rules={[{ required: true }]}
            >
            <Input placeholder="Phone Number" />
          </Form.Item>
        </Col> 
        {initialValues.patientInfo && initialValues.patientInfo.length > 0 ? (
          initialValues.patientInfo.map((patient, index) => (
            <Col span={8} xs={24} sm={12} lg={8} key={index}>
              <Form.Item
                label={`Age`}
                name={['patientInfo', index, 'age']}
                rules={[{ required: true }]}
              >
                <Input placeholder="Age" type="number" min={18} />
              </Form.Item>
            </Col>
          ))
        ) : (
          <Col span={8} xs={24} sm={12} lg={8} >
            <Form.Item
              label={`Age`}
              name={['patientInfo', 0, 'age']}
              rules={[{ required: true }]}
            >
              <Input placeholder="Age" type="number" min={18} />
            </Form.Item>
          </Col>
        )}
        {initialValues.patientInfo && initialValues.patientInfo.length > 0 ? (
          initialValues.patientInfo.map((patient, index) => (
            <Col span={8} xs={24} sm={12} lg={8} key={index}>
              <Form.Item
                label={`Height`}
                name={['patientInfo', index, 'height']}
                rules={[{ required: true }]}
              >
                <Input placeholder="Height" />
              </Form.Item>
            </Col>
          ))
        ) : (
          <Col span={8} xs={24} sm={12} lg={8} >
            <Form.Item
              label={`Height`}
              name={['patientInfo', 0, 'height']}
              rules={[{ required: true }]}
            >
              <Input placeholder="Height" />
            </Form.Item>
          </Col>
        )}
        {initialValues.patientInfo && initialValues.patientInfo.length > 0 ? (
          initialValues.patientInfo.map((patient, index) => (
            <Col span={8} xs={24} sm={12} lg={8} key={index}>
              <Form.Item
                label={`Weight`}
                name={['patientInfo', index, 'weight']}
                rules={[{ required: true }]}
              >
                <Input placeholder="Weight" type="number" min={100} />
              </Form.Item>
            </Col>
          ))
        ) : (
          <Col span={8} xs={24} sm={12} lg={8} >
            <Form.Item
              label={`Weight`}
              name={['patientInfo', 0, 'weight']}
              rules={[{ required: true }]}
            >
              <Input placeholder="Weight" type="number" min={100} />
            </Form.Item>
          </Col>
        )}
      </Row>
      <hr />
      <h1 className="card-title mt-3">Medical History</h1>
      <Row gutter={20}>
        {initialValues.patientInfo && initialValues.patientInfo.length > 0 ? (
          initialValues.patientInfo.map((patient, index) => (
            <Col span={8} xs={24} sm={12} lg={8} key={index}>
              <Form.Item
                label={`Bronchitis`}
                name={['patientInfo', index, 'bronchitis']}
                rules={[{ required: true }]}
              >
                  <Radio.Group defaultValue="radio_option1">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          ))
        ) : (
          <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item label="Bronchitis" name={['patientInfo', 0, 'bronchitis']} rules={[{ required: true }]}>
              <Radio.Group defaultValue="radio_option1">
                <Radio value="yes">Yes</Radio>
                <Radio value="no">No</Radio>
                <Radio value="I don't know">I don't know</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        )}
        {initialValues.patientInfo && initialValues.patientInfo.length > 0 ? (
          initialValues.patientInfo.map((patient, index) => (
            <Col span={8} xs={24} sm={12} lg={8} key={index}>
              <Form.Item
                label={`Asthma`}
                name={['patientInfo', index, 'asthma']}
                rules={[{ required: true }]}
              >
                  <Radio.Group defaultValue="radio_option2">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          ))
        ) : (
          <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item label="Asthma" name={['patientInfo', 0, 'asthma']} rules={[{ required: true }]}>
              <Radio.Group defaultValue="radio_option2">
                <Radio value="yes">Yes</Radio>
                <Radio value="no">No</Radio>
                <Radio value="I don't know">I don't know</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        )}
        {initialValues.patientInfo && initialValues.patientInfo.length > 0 ? (
          initialValues.patientInfo.map((patient, index) => (
            <Col span={8} xs={24} sm={12} lg={8} key={index}>
              <Form.Item
                label={`High Blood Pressure`}
                name={['patientInfo', index, 'high_blood_pressure']}
                rules={[{ required: true }]}
              >
                  <Radio.Group defaultValue="radio_option3">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          ))
        ) : (
          <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item label="High Blood Pressure" name={['patientInfo', 0, 'high_blood_pressure']} rules={[{ required: true }]}>
              <Radio.Group defaultValue="radio_option3">
                <Radio value="yes">Yes</Radio>
                <Radio value="no">No</Radio>
                <Radio value="I don't know">I don't know</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        )}
         {initialValues.patientInfo && initialValues.patientInfo.length > 0 ? (
          initialValues.patientInfo.map((patient, index) => (
            <Col span={8} xs={24} sm={12} lg={8} key={index}>
              <Form.Item
                label={`Diabetes`}
                name={['patientInfo', index, 'diabetes']}
                rules={[{ required: true }]}
              >
                  <Radio.Group defaultValue="radio_option4">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          ))
        ) : (
          <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item label="Diabetes" name={['patientInfo', 0, 'diabetes']} rules={[{ required: true }]}>
              <Radio.Group defaultValue="radio_option4">
                <Radio value="yes">Yes</Radio>
                <Radio value="no">No</Radio>
                <Radio value="I don't know">I don't know</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        )}
        {initialValues.patientInfo && initialValues.patientInfo.length > 0 ? (
          initialValues.patientInfo.map((patient, index) => (
            <Col span={8} xs={24} sm={12} lg={8} key={index}>
              <Form.Item
                label={`Epilepsy / Seizures`}
                name={['patientInfo', index, 'epilepsy_seizures']}
                rules={[{ required: true }]}
              >
                  <Radio.Group defaultValue="radio_option5">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          ))
        ) : (
          <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item label="Epilepsy / Seizuress" name={['patientInfo', 0, 'epilepsy_seizures']} rules={[{ required: true }]}>
              <Radio.Group defaultValue="radio_option5">
                <Radio value="yes">Yes</Radio>
                <Radio value="no">No</Radio>
                <Radio value="I don't know">I don't know</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        )}
      </Row>

      <div className="d-flex justify-content-end">
        <Button className="primary-button" htmlType="submit">
          SUBMIT
        </Button>
      </div>
    </Form>
  );
}

export default MedicalForm;