import React, { useState, useEffect } from 'react';
import {
  registerUser,
  loginUser,
  setServerURL,
  getServerURL,
  getRegistrationStatus,
} from '../api';
import visibilityOff from '../images/visibility-off.svg';
import visibilityOn from '../images/visibility-on.svg';

function Login({ isAuthed }) {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const showServerURL = process.env.REACT_APP_SHOW_SERVER_URL === 'true';
  const [serverURL, setServerURLState] = useState(getServerURL());
  const [error, setError] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(false);

  useEffect(() => {
    getRegistrationStatus(serverURL)
      .then((s) => setRegistrationOpen(s.open))
      .catch(() => setRegistrationOpen(false));
  }, [serverURL]);

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
      {showServerURL && (
        <>
          <label htmlFor="serverURL">Server URL</label>
          <input
            type="url"
            id="serverURL"
            required
            value={serverURL}
            onChange={(e) => setServerURLState(e.target.value)}
          />
        </>
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
          className="btn btn__icon"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <img src={showPassword ? visibilityOn : visibilityOff} alt="" />
        </button>
      </div>

      <button type="submit" className="btn" value="login">
        Log in
      </button>

      {registrationOpen && (
        <button type="submit" className="btn" value="register">
          Register
        </button>
      )}
    </form>
  );
}

export default Login;
