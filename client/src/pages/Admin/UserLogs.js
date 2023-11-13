import React from "react";
import Layout from "../../components/Layout";
import { Tabs } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";


const UserLogs = () => {
  const {user} = useSelector((state) => state.user);
  const navigate = useNavigate();
  
  return (
    <Layout>
      <h1 className="page-title">User Logs</h1>
      <hr />

      <Tabs>
        <Tabs.TabPane tab="User Activity" key={0}>
          {user?.userLogs.map((log) => (
            <div className="card p-2 mt-2" onClick={() => navigate(log.onClickPath)}>
              <div className="card-text">{log.message}</div>
            </div>
          ))}
        </Tabs.TabPane>
      </Tabs>
    </Layout>
  );
};

export default UserLogs;
