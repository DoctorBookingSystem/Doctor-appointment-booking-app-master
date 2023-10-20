import { Button, Form, Input, Checkbox } from "antd";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { hideLoading, showLoading } from "../redux/alertsSlice";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const onFinish = async (values) => {
    try {

      if (!values.agreedToTerms) {
        toast.error("You must agree to the terms and conditions.");
        return;
      }

      dispatch(showLoading());
      const response = await axios.post("/api/user/register", values);
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/login");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="authentication">
      <div className="authentication-form card p-3">
        <h1 className="card-title">Nice To Meet You</h1>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Name" name="name">
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item label="Phone Number" name="phoneNumber">
            <Input placeholder="Phone Number" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input placeholder="Password" type="password" />
          </Form.Item>
          <Form.Item name="agreedToTerms" valuePropName="checked" rules={[{ required: true, message: "You must agree to the terms and conditions." }]}>
            <Checkbox>
              I agree/I have carefully read the terms and conditions 
            </Checkbox>
          </Form.Item>


          <Button
            className="primary-button my-2 full-width-button"
            htmlType="submit"
          >
            REGISTER
          </Button>

          <div className="mt-2">
            <div className="anchor" style={{ color: "black" }}>
              <Link to="/terms">
                READ TERMS AND CONDITIONS
              </Link>
            </div>

            <div className="anchor mt-2" style={{ color: "black" }}>
              <Link to="/login">
                CLICK HERE TO LOGIN
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Register;
