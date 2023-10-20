// import { Row, Col, Button, Form, Input } from "antd";
// import React, { useState } from "react";
// import toast from "react-hot-toast";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";

// function EnterCode() {
//   const [authCode, setAuthCode] = useState("");
//   const navigate = useNavigate();

//   const handleCodeVerification = async () => {
//     try {
//       // Send the authCode to the server for verification
//       const response = await axios.post("/api/user/verify-2fa", { authCode });

//       if (response.data.success) {
//         toast.success(response.data.message);
//         // Handle successful verification, for example, redirect to the dashboard
//         localStorage.setItem("token", response.data.data);
//         navigate("/"); // Redirect to the dashboard or any other authenticated page
//       } else {
//         // Handle verification failure (for example, display an error message)
//         toast.error(response.data.message);
//       }
//     } catch (error) {
//       // Handle verification error (for example, display a generic error message)
//       toast.error("Verification failed. Please try again.");
//     }
//   };

//   return (
//     <div className="authentication">
//       <div className="authentication-form card p-4">
//         <h1 className="card-title">Enter Authentication Code</h1>
//         <Form layout="vertical">
//           <Form.Item label="Authentication Code" name="authCode">
//             <Input placeholder="Enter 6-digit code" value={authCode} onChange={(e) => setAuthCode(e.target.value)} />
//           </Form.Item>
//           <Row justify="space-between">
//             <Col>
//               <Button className="primary-button my-2 full-width-button" onClick={handleCodeVerification}>
//                 VERIFY CODE
//               </Button>
//             </Col>
//           </Row>
//           <Link to="/login" className="anchor mt-2">
//             Back to Login
//           </Link>
//         </Form>
//       </div>
//     </div>
//   );
// }

// export default EnterCode;
