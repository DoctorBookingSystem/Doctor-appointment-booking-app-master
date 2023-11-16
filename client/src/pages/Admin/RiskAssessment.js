import React, { useMemo, useState, useEffect } from 'react';
import '../../index.css'; 
import Layout from "../../components/Layout";
import { showLoading, hideLoading } from "../../redux/alertsSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";


const RiskAssessment = () => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    risk_id: '',
    description: '',
    impact_level: '',
    probability_level: '',
    resolve: '', 
    completed: '', 
  });

  const [tableData, setTableData] = useState([]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        dispatch(showLoading());
        const response = await axios.post(
          "/api/admin/add_risk",
          {
            risk_id: formData.risk_id,
            description: formData.description,
            impact_level: formData.impact_level, 
            probability_level: formData.probability_level, 
            resolve: formData.resolve, 
            completed: formData.completed, 
          },
          {
            headers: {
                'Content-Type': 'application/json',            
            },
          }
        );

        dispatch(hideLoading());
        if (response.data.success) {
            setFormData({
                risk_id: '',
                description: '',
                impact_level: '',
                probability_level: '',
                resolve: '',
                completed: '',
              });
        }
      } catch (error) {
        console.log(error);
        dispatch(hideLoading());
      }

    // Update tableData with new entry
    setTableData((prevData) => [...prevData, { ...formData }]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/admin/get_risks');
        if (response.data.success) {
          setTableData(response.data.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []); 

  return (
    <Layout>
    <div >
      <form onSubmit={handleSubmit} className="risk-form" >
        <label>
          ID:
          <input type="text" name="risk_id" value={formData.risk_id} onChange={handleChange} />
        </label>
        <label>
          Description:
          <input type="text" name="description" value={formData.description} onChange={handleChange} />
        </label>
        <label>
          Impact Level:
          <select name="impact_level" value={formData.impact_level} onChange={handleChange}>
            <option value="blank"></option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>
          Probability Level:
          <select name="probability_level" value={formData.probability_level} onChange={handleChange}>
            <option value="blank"></option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>
          How to Resolve:
          <input type="text" name="resolve" value={formData.resolve} onChange={handleChange} />
        </label>
        <label>
          Completed:
          <select name="completed" value={formData.completed} onChange={handleChange}>
            <option value="blank"></option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
        <button type="submit">Add Risk</button>
      </form>

      <h2 className="table-title">Risk Assessment</h2>
      <table className="risk-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Incident Description</th>
            <th>Impact Level</th>
            <th>Probability Level</th>
            <th>How to Resolve</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row.risk_id}>
              <td>{row.risk_id}</td>
              <td>{row.description}</td>
              <td>{row.impact_level}</td>
              <td>{row.probability_level}</td>
              <td>{row.resolve}</td>
              <td>{row.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </Layout>
  );
};

export default RiskAssessment;
