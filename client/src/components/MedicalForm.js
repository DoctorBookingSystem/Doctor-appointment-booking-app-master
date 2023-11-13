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
      <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item 
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
        <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item 
            label="Age" 
            name="age"
            rules={[{ required: true }]}
            >
            <Input placeholder="Age" type="number" min={18}/>
            </Form.Item>
        </Col> 
        <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item 
            label="Height" 
            name="height"
            rules={[{ required: true }]}
            >
            <Input placeholder="Height" />            
            </Form.Item>
        </Col> 
        <Col span={8} xs={24} sm={12} lg={8}>
            <Form.Item 
            label="Weight" 
            name="weight"
            rules={[{ required: true }]}
            >
            <Input placeholder="Weight" type="number" min={90}/>            
            </Form.Item>
        </Col> 
      </Row>
      <hr />
      <h1 className="card-title mt-3">Medical History</h1>
      <Row gutter={20}>
        <Col span={8} xs={24} sm={12} lg={8}>
              <Form.Item label="Bronchitis" name="bronchitis" rules={[{ required: true }]}>
                <Radio.Group defaultValue="radio_option1">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
        </Col>
        <Col span={8} xs={24} sm={12} lg={8}>
              <Form.Item label="Asthma" name="asthma" rules={[{ required: true }]}>
                <Radio.Group defaultValue="radio_option2">
                <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
        </Col>
        <Col span={8} xs={24} sm={12} lg={8}>
              <Form.Item label="High Blood Pressure" name="high_blood_pressure" rules={[{ required: true }]}>
                <Radio.Group defaultValue="radio_option3">
                <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
        </Col>
        <Col span={8} xs={24} sm={12} lg={8}>
              <Form.Item label="Diabetes" name="diabetes" rules={[{ required: true }]}>
                  <Radio.Group defaultValue="radio_option4">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
              </Form.Item>
         </Col>
        <Col span={8} xs={24} sm={12} lg={8}>
              <Form.Item label="Epilepsy / Seizures" name="epilepsy_seizures" rules={[{ required: true }]}>
                <Radio.Group defaultValue="radio_option5">
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                  <Radio value="I don't know">I don't know</Radio>
                </Radio.Group>
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

export default MedicalForm;
