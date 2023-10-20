import { Row, Col, Button, Form, Input } from "antd";
import toast from "react-hot-toast";
import React from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { hideLoading, showLoading } from "../redux/alertsSlice";
import axios from "axios";
import { useState } from "react";


function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const onFinish = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post("/api/user/login", values);
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        localStorage.setItem("token", response.data.data);
        navigate("/");
      } else {
        if (response.data.message.includes("locked")) {
          setIsAccountLocked(true);
        }
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="authentication">
      <div className="authentication-form card p-4">
        <h1 className="card-title">FIU Doctor Booking System</h1>
        {isAccountLocked && (
          <p style={{ color: "red" }}>Account locked due to too many unsuccessful login attempts. Please try again later.</p>
        )}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Email" name="email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input placeholder="Password" type="password" />
          </Form.Item>
          <Row justify="space-between">
            <Col>
              <Button className="primary-button my-2 full-width-button" htmlType="submit">
                LOGIN
              </Button>
            </Col>
            <Col>
              <Link to="/forgot-password" className="anchor">
                Forgot Password?
              </Link>
            </Col>
          </Row>
          <Link to="/register" className="anchor mt-2">
            CLICK HERE TO REGISTER
          </Link>
        </Form>
      </div>
    </div>
  );
}

export default Login;

// function Login() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const onFinish = async (values) => {
//     try {
//       dispatch(showLoading());
//       const response = await axios.post("/api/user/login", values);
//       dispatch(hideLoading());

//       if (response.data.success) {
//         // Display a success message to the user
//         toast.success("Authentication Code sent.");

//         // Redirect to EnterCode page
//         navigate("/enter-code");
        
//       } else {
//         // Handle login failure (display an error message)
//         toast.error(response.data.message);
//       }
//     } catch (error) {
//       // Handle login error (display a generic error message)
//       dispatch(hideLoading());
//       toast.error("Something went wrong");
//     }
//   };

//   return (
//     <div className="authentication">
//       <div className="authentication-form card p-4">
//         <h1 className="card-title">FIU Doctor Booking System</h1>
//         <Form layout="vertical" onFinish={onFinish}>
//           <Form.Item label="Email" name="email">
//             <Input placeholder="Email" />
//           </Form.Item>
//           <Form.Item label="Password" name="password">
//             <Input placeholder="Password" type="password" />
//           </Form.Item>
//           <Row justify="space-between">
//             <Col>
//               <Button
//                 className="primary-button my-2 full-width-button"
//                 htmlType="submit"
//               >
//                 LOGIN
//               </Button>
//             </Col>
//             <Col>
//               <Link to="/forgot-password" className="anchor">
//                 Forgot Password?
//               </Link>
//             </Col>
//           </Row>
//           <Link to="/register" className="anchor mt-2">
//             CLICK HERE TO REGISTER
//           </Link>
//         </Form>
//       </div>
//     </div>
//   );
// }

// export default Login;


  

