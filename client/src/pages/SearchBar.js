// Create a new file named SearchBar.js
import React, { useState, useEffect } from 'react';
import axios from "axios";

const SearchBar = ({ onSearch }) => {
  const [specialization, setSpecialization] = useState('');
  const [specializations, setSpecializations] = useState([]);

  const handleSpecializationChange = (event) => {
    setSpecialization(event.target.value);
  };

  const handleDropdownClick = async () => {
    try {
      // Fetch specializations from the server when the dropdown is clicked
      const response = await axios.get('/api/doctor/doctors_specialization', {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      });

      if (response.data.success) {
        const uniqueSpecializations = [...new Set(response.data.data)];
        setSpecializations(uniqueSpecializations);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = () => {
    onSearch(specialization); // Pass the selected specialization directly
  };

  return (
    <div className="search-bar">
      <select
        value={specialization}
        onChange={handleSpecializationChange}
        onClick={handleDropdownClick}
      >
        <option value="">All Specializations</option>
        {specializations.map((specializationOption) => (
          <option key={specializationOption} value={specializationOption}>
            {specializationOption}
          </option>
        ))}
      </select>
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;
