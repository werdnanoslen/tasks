import React, { useState } from 'react';
import { registerUser, loginUser } from '../api';

function Login({ isAuthed }) {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = async () => {
    loginUser({
      username,
      password,
    })
      .then(isAuthed)
      .catch((err) => {
        setError(err.response.data.message);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitter = e.nativeEvent.submitter.value;
    if (submitter === 'register') {
      await registerUser({
        username,
        password,
      })
        .then(login)
        .catch((err) => {
          setError(err.response.data.message);
        });
    } else {
      login();
    }
  };

  return (
    <form className="login-wrapper" onSubmit={handleSubmit}>
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
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
        minLength={6}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" className="btn" value="login">
        Log in
      </button>

      <button type="submit" className="btn" value="register">
        Register
      </button>
    </form>
  );
}

export default Login;
