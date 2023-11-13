import React, { useState } from "react";
import { Row, Col, Button, Form, Input } from "antd";
import toast from "react-hot-toast";
import axios from "axios";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { hideLoading, showLoading } from "../redux/alertsSlice";

function SecureHealthInfo() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(true); // Initially set to true to avoid error message on initial render

  const onFinish = async (values) => {
    try {
      dispatch(showLoading());
      // Send a request to the server to validate the password
      const response = await axios.post("/api/user/validate-password", values);
      dispatch(hideLoading());
      if (response.data.success) {
        // Password is correct, navigate to the health information page
        setIsPasswordCorrect(true);
        navigate("/healthinformation");
      } else {
        // Password is incorrect, show error message
        if (response.data.message.includes("Breach")) {
            setIsAccountLocked(true);
          }
        toast.error(response.data.message);
        setIsPasswordCorrect(false);
        //toast.error("Incorrect password. Please try again.");
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="authentication">
      <div className="authentication-form card p-4">
        <h1 className="card-title">Health Information</h1>
        {isAccountLocked && !isPasswordCorrect && (
          <p style={{ color: "red" }}>Incorrect password. Please try again.</p>
        )}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Password" name="password">
            <Input placeholder="Enter your password to access Health Info" type="password" />
          </Form.Item>
          <Row justify="space-between">
            <Col>
              <Button className="primary-button my-2 full-width-button" htmlType="submit">
                ACCESS
              </Button>
            </Col>
          </Row>
          <Link to="/" className="anchor mt-2">
            BACK TO DASHBOARD
          </Link>
        </Form>
      </div>
    </div>
  );
}

export default SecureHealthInfo;
