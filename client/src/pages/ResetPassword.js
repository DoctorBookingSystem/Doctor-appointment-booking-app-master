import { Button, Form, Input } from "antd";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

function ResetPassword() {
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [resetCodeEntered, setResetCodeEntered] = useState(false);
  const navigate = useNavigate();

  const handleVerifyResetCode = async () => {
    try {
      // Validate reset code on the server
      await axios.post("/api/user/verify-reset-code", { resetCode });
      // If the reset code is valid, allow the user to enter new password
      setResetCodeEntered(true);
      toast.success("Reset Code Verified Successfully"); // Clear any previous error messages
    } catch (error) {
      console.error(error);
      setResetCodeEntered(false);
      toast.error("Invalid reset code. Please enter a valid reset code.");
    }
  };

  const handleResetPassword = async () => {
    try {
      // Check if new password and confirm password match
      if (newPassword !== confirmPassword) {
        setMessage("Passwords do not match. Please re-enter your new password.");
        return;
      }

      // Call the reset password API endpoint
      await axios.post("/api/user/reset-password", { resetCode, newPassword });
      toast.success("Password changed successfully!");
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error("Error resetting password.");
    }
  };

  return (
    <div className="authentication">
      <div className="authentication-form card p-4">
        <h1 className="card-title">Change Password</h1>
        {!resetCodeEntered ? (
          <div>
            <Input
              type="text"
              placeholder="Enter reset code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
            />
            <Button className="primary-button my-2" onClick={handleVerifyResetCode}>
              Verify Reset Code
            </Button>
            <p>{message}</p>
          </div>
        ) : (
          <Form layout="vertical">
            <Form.Item label="New Password">
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Confirm Password">
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Item>
            <Button className="primary-button my-2" onClick={handleResetPassword}>
              Reset Password
            </Button>
            <p>{message}</p>
          </Form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;

