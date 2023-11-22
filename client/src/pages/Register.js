import { Button, Form, Input, Select, Checkbox } from "antd";
import React, {useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { hideLoading, showLoading } from "../redux/alertsSlice";
import { setIsDoctor } from '../redux/userSlice';


function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState(""); // State for user type selection
  const [passwordValidation, setPasswordValidation] = useState({
    message: "",
    isValid: false,
  });

  const checkPasswordStrength = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (strongRegex.test(password)) {
      setPasswordValidation({ message: "", isValid: true });
    } else {
      setPasswordValidation({
        message:
          "Password must have at least 8 characters, one uppercase letter, and one special character (!@#$%^&*).",
        isValid: false,
      });
    }
  };

  const onFinish = async (values) => {
    
    checkPasswordStrength(password);

    if (passwordValidation.isValid) {
      try {
        dispatch(showLoading());

        if (values.userType === 'Doctor') {
          values.isDoctor = true;
          dispatch(setIsDoctor(true));
        }
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
    } else {
      toast.error("Enter a strong password.");
    }
  };

  return (
    <div className="authentication">
      <div className="authentication-form card p-3">
        <h1 className="card-title">Nice To Meet U</h1>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="First name" name="name" rules={[{ required: true, message: 'First name is required.'}]}>
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item label="Last name" name="lastName" rules={[{ required: true, message: 'Last name is required.'}]}>
            <Input placeholder="Last name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email address' }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="Phone Number" name="phoneNumber" rules={[{ required: true, message: 'Phone number is required.'}]}>
            <Input type= 'number' placeholder="Phone Number" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            validateStatus={passwordValidation.isValid ? "success" : "error"}
            help={passwordValidation.message}
          >
            <Input
              placeholder="Password"
              type="password"
              onChange={(e) => {
                setPassword(e.target.value);
                checkPasswordStrength(e.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="User Type" name="userType" rules={[{ required: true, message: 'User Type is required.'}]}>
            <Select
              placeholder="Select user type"
              onChange={(value) => setUserType(value)}
            >
              <Select.Option value="Doctor">Doctor</Select.Option>
              <Select.Option value="Patient">Patient</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="agreedToTerms" valuePropName="checked" rules={[{ required: true, message: "You must agree to the terms and conditions." }]}>
          <Checkbox>
            I agree/I have carefully read the terms and conditions{" "}
            {userType === "Doctor" ? (
              <Link to="/doctor-terms">(Read Terms and Conditions for Doctors)</Link>
            ) : (
              <Link to="/patient-terms">
                (Read Terms and Conditions for Patients)
              </Link>
            )}
          </Checkbox>
        </Form.Item>
          <Button
            className="primary-button my-2 full-width-button"
            htmlType="submit"
          >
            REGISTER
          </Button>

          <Link to="/login" className="anchor mt-2">
            Back to login
          </Link>
        </Form>
      </div>
    </div>
  );
}
export default Register;
