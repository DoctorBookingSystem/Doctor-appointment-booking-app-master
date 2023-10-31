import { Button, Form, Input } from "antd";
import React, { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { hideLoading, showLoading } from "../redux/alertsSlice";

function Recover() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempEnteredPW, setTempEnteredPW] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    message: "",
    isValid: false,
  });

  const checkPasswordStrength = (newPassword) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (strongRegex.test(newPassword)) {
      setPasswordValidation({ message: "", isValid: true });
    } else {
      setPasswordValidation({
        message:
          "Password must have at least 8 characters, one uppercase letter, and one special character (!@#$%^&*).",
        isValid: false,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (step === 1) {
        setLoading(true);
        const response = await axios.post("/api/user/temp-password", {email});
        if (response.data.success) {
          setLoading(false);
          setTemporaryPassword(response.data.data);
          setStep(2);
          toast.success(response.data.message);
        } else {
          setLoading(false);
          toast.error(response.data.message);
        }
      }
      if (step === 2) {
        setLoading(true);
        try {
          // const response = await axios.post("/api/user/verify-temp-password", {
          //   email,
          // });
          checkPasswordStrength(password);
          if (tempEnteredPW === tempEnteredPW && passwordValidation.isValid) {
            setLoading(false);
            toast.success("Your account has been recovered.");
            navigate("/");
          } else {
            setLoading(false);
            toast.error("The temporary password did not match.");
          }
        } catch (error) {
          setLoading(false);
          console.error(error);
          toast.error("An error occurred while verifying temporary password.");
        }
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error("An error occurred while recovering account.");
    }
  };
  
  return (
    <div className="authentication">
      <div className="authentication-form card p-4">
        <h1 className="card-title">Account Recovery</h1>
        <form layout="vertical" onSubmit={(e) => e.preventDefault()}>
        {step === 1 && (
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
          )}
          {step === 2 && (
            <div>
            <Form.Item
              label="Temporary Code:"
              name="temp-code"
            ></Form.Item>
            <input
              type="text"
              //placeholder="Enter temporary code"
              value={tempEnteredPW}
              onChange={(e) => setTempEnteredPW(e.target.value)}
              style={{ width: '100%' }}
            />
            <Form.Item
              label="Password"
              name="password"
              validateStatus={passwordValidation.isValid ? "success" : "error"}
              help={passwordValidation.message}
            ></Form.Item>
            <input
              type="password"
              //placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkPasswordStrength(e.target.value);
              }}
              style={{ width: '100%' }}
            />
            </div>
          )}
         <button
            className="primary-button my-2 full-width-button"
            onClick={(e) => {
              e.preventDefault(); 
              handleSubmit(); 
            }}
          >
          {step === 1 ? 'Send' : 'Submit'}
        </button>
        </form>
      </div>
    </div>
  );
}
export default Recover;
