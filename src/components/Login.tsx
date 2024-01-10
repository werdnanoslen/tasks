import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { loginUser } from '../api';

function Login({ setToken }) {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await loginUser({
      username,
      password,
    });
    setToken(token);
  };

  return (
    <form className="login-wrapper" onSubmit={handleSubmit}>
      <label htmlFor="username">Username</label>
      <input
        type="text"
        id="username"
        required
        maxLength={20}
        onChange={(e) => setUserName(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        type="password"
        id="password"
        required
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" className="btn">
        Submit
      </button>
    </form>
  );
}

Login.propTypes = {
  setToken: PropTypes.func.isRequired,
};

export default Login;
