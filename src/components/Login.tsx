import React, { useState } from 'react';
import { registerUser, loginUser, setServerURL, getServerURL } from '../api';

function Login({ isAuthed }) {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverURL, setServerURLState] = useState(getServerURL());
  const [error, setError] = useState('');

  const login = async () => {
    // Update server URL before login
    setServerURL(serverURL);

    loginUser({
      username,
      password,
    })
      .then(isAuthed)
      .catch((err) => {
        const msg =
          err.response?.data?.message || err.message || 'Network error';
        setError(msg);
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
          const msg =
            err.response?.data?.message || err.message || 'Network error';
          setError(msg);
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
      <label htmlFor="serverURL">Server URL</label>
      <input
        type="url"
        id="serverURL"
        required
        value={serverURL}
        onChange={(e) => setServerURLState(e.target.value)}
      />

      <label htmlFor="username">Username</label>
      <input
        type="text"
        id="username"
        required
        maxLength={20}
        onChange={(e) => setUserName(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <div className="password-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          id="password"
          required
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="btn password-toggle"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

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
