import { Button, Col, Form, Input, Row, TimePicker } from "antd";
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import MedicalForm from "../components/MedicalForm";
import moment from "moment";

function HealthInformation() {
  const { user } = useSelector((state) => state.user);
  const params = useParams();
  const [user1, setUser1] = useState();
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [buttonEnabled, setButtonEnabled] = useState(true);
  const storedAcceptPressed = localStorage.getItem('acceptPressed');
  const storedDeclinePressed = localStorage.getItem('declinePressed');
  const [acceptPressed, setAcceptPressed] = useState(storedAcceptPressed === 'true');
  const [declinePressed, setDeclinePressed] = useState(storedDeclinePressed === 'true');

  const handleRequest = async () =>{
    // Reset the acceptPressed and declinePressed values in localStorage
    localStorage.setItem('acceptPressed', 'false');
    localStorage.setItem('declinePressed', 'false');

    // Update state to reflect the changes
    setAcceptPressed(false);
    setDeclinePressed(false);
    try {
      const { userId, name, lastName } = user1;

      dispatch(showLoading());
      setCount(count+1);

      const response = await axios.post(
        "/api/admin/request_changes",
        {
          _id: userId,
          name: name,
          lastName: lastName
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("Error in handleRequest:", error); // Log the error details
      toast.error("Something went wrong");
    }
  }

  const onFinish = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/user/update-user-profile",
        {
          ...values,
          _id: params.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Something went wrong");
    }
  };

  const getUserData = async (userId) => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/user/get-user-info-by-id",
        {
          _id: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      dispatch(hideLoading());
      if (response.data.success) {
        setUser1(user);
      }
    } catch (error) {
      console.log(error);
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getUserData();
  }, []); 

  return (
    <Layout>
      <h1 className="page-title">My Health Information</h1>
      <hr />  
    {user ? (
      <div>
        {user.patientInfo.length > 0 && user.request == false ? (
          <div>
            <h5>Basic Information</h5>
            <p>Name: {user.name}</p>
            <p>Last Name: {user.lastName}</p>
            <p>Phone Number: {user.phoneNumber}</p>
            {user.patientInfo.map((info, index) => (
              <div key={index}>
                <p>Age: {info.age}</p>
                <p>Height: {info.height}</p>
                <p>Weight: {info.weight}</p>
              </div>
            ))}
          </div>
        ) : (
          <p> </p>
        )}
        {user.patientInfo.length > 0 && user.request == false ? (
          (
            <div style={{ marginTop: '20px' }}>
              <h5>Medical History</h5>
              {user.patientInfo.map((info, index) => (
                <div key={index}>
                  <p>bronchitis: {info.bronchitis}</p>
                  <p>asthma: {info.asthma}</p>
                  <p>High Blood Pressure: {info.high_blood_pressure}</p>
                  <p>Diabetes: {info.diabetes}</p>
                  <p>epilepsy_seizures: {info.epilepsy_seizures}</p>
                </div>
              ))}
              <div className="d-flex justify-content-end">
                <Button
                  className="primary-button"
                  htmlType="submit"
                  onClick={handleRequest}
                  disabled={count !== 0}
                >
                {count === 0 ? 'Request Changes' : 'Changes Requested'}
              </Button>
              </div>
            </div>
          )
        ) : (

      <MedicalForm
        onFinish={onFinish}
        initialValues={{
          ...user,
        }}
      />      
      )}
      </div>
    ) : (
      <div>
      <MedicalForm
        onFinish={onFinish}
        initialValues={{
          ...user,
        }}
      />
      </div>
    )}
        </Layout>
      );
  }

export default HealthInformation;
