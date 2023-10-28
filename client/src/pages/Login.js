import { Button, Form, Input } from "antd";
import React, { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { hideLoading, showLoading } from "../redux/alertsSlice";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      if (step === 1) {
        // Step 1: User enters email and password
        setLoading(true);

        const response = await axios.post("/api/user/login", {email, password});
        if (response.data.success) {
          setLoading(false);
          // Email sent successfully, move to step 2
          setTwoFactorCode(response.data.twoFactorCode);
          setStep(2);
          toast.success(response.data.message);
        } else {
          setLoading(false);
          // Handle email sending error
          toast.error(response.data.message);
        }
      }
      if (step === 2) {
        // Step 2: User enters 2FA code
        setLoading(true);
        try {
          const response = await axios.post("/api/user/verify-2fa", {
            email, twoFactorCode,
          });
          if (response.data.success) {
            setLoading(false);
            
            // Grant access
            toast.success(response.data.message);
            // Handle token storage securely
            localStorage.setItem("token", response.data.data);
            navigate("/");
          } else {
            setLoading(false);
            // Invalid 2FA code or other errors
            toast.error(response.data.message);
          }
        } catch (error) {
          setLoading(false);
          // Handle API request error
          console.error(error);
          toast.error("An error occurred while verifying 2FA code.");
        }
      }
    } catch (error) {
      setLoading(false);
      // Handle API request error
      console.error(error);
      toast.error("An error occurred while logging in.");
    }
  };
  
  return (
    <div className="authentication">
      <div className="authentication-form card p-4">
        <h1 className="card-title">FIU Doctor Booking System</h1>
        <form layout="vertical" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%' }}
          />
          <br />
          {step === 2 && (
            <input
              type="text"
              placeholder="Enter 2FA Code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              style={{ width: '100%' }}
            />
          )}
         <button
            className="primary-button my-2 full-width-button"
            onClick={(e) => {
              e.preventDefault(); 
              handleLogin(); 
            }}
          >
          {step === 1 ? 'Login' : 'Verify 2FA'}
        </button>
        <Link to="/register" className="anchor mt-2" style={{ display: 'block' }}>
          Register
        </Link>
        <Link to="/forgot-password" className="anchor" style={{ display: 'block' }}>
          Forgot Password
        </Link>
        </form>
      </div>
    </div>
  );
}
export default Login;
