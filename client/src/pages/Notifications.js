import { Tabs } from "antd";
import axios from "axios";
import React from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { hideLoading, showLoading } from "../redux/alertsSlice";
import { setUser } from "../redux/userSlice";
import React, { useState, useEffect } from 'react';

function Notifications() {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [userRequest, setUserRequest] = useState(null);

  const markAllAsSeen=async()=>{
    try {
        dispatch(showLoading());
        const response = await axios.post("/api/user/mark-all-notifications-as-seen", {userId : user._id} , {
            headers: {
                Authorization : `Bearer ${localStorage.getItem("token")}`
            }
        });
        dispatch(hideLoading());
        if (response.data.success) {
          toast.success(response.data.message)
          dispatch(setUser(response.data.data));
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        dispatch(hideLoading());
        toast.error("Something went wrong");
      }
  }

  const deleteAll=async()=>{
    try {
        dispatch(showLoading());
        const response = await axios.post("/api/user/delete-all-notifications", {userId : user._id} , {
            headers: {
                Authorization : `Bearer ${localStorage.getItem("token")}`
            }
        });
        dispatch(hideLoading());
        if (response.data.success) {
          toast.success(response.data.message)
          dispatch(setUser(response.data.data));
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        dispatch(hideLoading());
        toast.error("Something went wrong");
      }
  }
    const fetchUserById = async (userId, action) => {
      try {
        markAllAsSeen();
        console.log("Client: "+userId);
        const response = await axios.post(
          "/api/user/set_request",
          {
            _id: userId,
            action: action

          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
    
        if (response.data.success) {
          setUserRequest(response.data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

  return (
    <Layout>
      <h1 className="page-title">Notifications</h1>
      <hr />

      <Tabs>
        <Tabs.TabPane tab="Unseen" key={0}>
          <div className="d-flex justify-content-end">
            <h1 className="anchor" onClick={()=>markAllAsSeen()}>Mark all as seen</h1>
          </div>

          {user?.unseenNotifications.map((notification) => (
            <div className="card p-2 mt-2" onClick={()=>navigate(notification.onClickPath)}>
                <div className="card-text">{notification.message}</div>
                {notification.request ? (
                  <div>
                  <span
                    className="clickable-text"
                    onClick={() => fetchUserById(notification.user,"accept")}
                  >
                    Accept
                  </span>
                  <span
                    className="clickable-text"
                    onClick={() => fetchUserById(notification.user, "decline")}
                    style={{ marginLeft: '10px' }} 
                  >
                    Decline
                  </span>
                  </div>
                ) : <p></p>}
            </div>
          ))}
        </Tabs.TabPane>
        <Tabs.TabPane tab="seen" key={1}>
          <div className="d-flex justify-content-end">
            <h1 className="anchor" onClick={()=>deleteAll()}>Delete all</h1>
          </div>
          {user?.seenNotifications.map((notification) => (
            <div className="card p-2 mt-2" onClick={()=>navigate(notification.onClickPath)}>
                <div className="card-text">{notification.message}</div>
            </div>
          ))}
        </Tabs.TabPane>
      </Tabs>
    </Layout>
  );
}

export default Notifications;
