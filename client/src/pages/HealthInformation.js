import { Button } from "antd";
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import MedicalForm from "../components/MedicalForm";


function HealthInformation() {
  //const { user } = useSelector((state) => state.user);
  const params = useParams();
  const [user1, setUser1] = useState(null);
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleRequest = async () =>{
    try {
      dispatch(showLoading());
      setCount(count+1);
      const response = await axios.post(
        "/api/admin/request_changes",
        {
          _id: params.userId,
          name: user1.name,
          lastName: user1.lastName
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
        console.log(response);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
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
          // timings: [
          //   moment(values.timings[0]).format("h:mm a"),
          //   moment(values.timings[1]).format("h:mm a"),
          // ],
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
        console.log(response);
        navigate("/");
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
        setUser1(response.data.data);
        console.log(user1);
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

  {user1 ? (
    <div>
      {user1.patientInfo.length > 0 && user1.request === false ? (
        <div>
          <h5>Basic Information</h5>
          <p>Name: {user1.name}</p>
          <p>Email: {user1.email}</p>
          <p>Phone Number: {user1.phoneNumber}</p>
          {user1.patientInfo.map((info, index) => (
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
      {user1.patientInfo.length > 0 && user1.request === false ? (
        (
          <div style={{ marginTop: '20px' }}>
            <h5>Medical History</h5>
            {user1.patientInfo.map((info, index) => (
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
        ...user1,
      }}
    />      
    )}
    </div>
  ) : (
    <div>
    <MedicalForm
      onFinish={onFinish}
      initialValues={{
        ...user1,
      }}
    />
    </div>
  )}
      </Layout>
    );
}

export default HealthInformation;