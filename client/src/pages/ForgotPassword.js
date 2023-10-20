import { Button, Form, Input } from "antd";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate(); // Access the navigate function

  const handleForgotPassword = async () => {
    try {
      await axios.post("/api/user/forgot-password", { email });
      toast.success("Reset code sent to your email.");

      // Redirect to ResetPassword page after sending the reset code
      navigate("/reset-password");
    } catch (error) {
      console.error(error);
      toast.error("Error sending reset code.");
    }
  };

  return (
    <div className="authentication">
      <div className="authentication-form card p-4">
        <h1 className="card-title">Forgot Password</h1>
        <Form layout="vertical">
          <Form.Item label="Email">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>
          <Button className="primary-button my-2 full-width-button" onClick={handleForgotPassword}>
            Send Reset Code
          </Button>
          <Link to="/login" className="anchor mt-2">
            Back to Login
          </Link>
        </Form>
      </div>
    </div>
  );
}

export default ForgotPassword;