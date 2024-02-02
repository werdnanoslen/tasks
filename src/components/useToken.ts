import { useState } from 'react';
import cookieParser from 'cookie-parser';

export default function useToken() {
  const getToken = () => {
    const tokenString = localStorage.getItem('token');
    if (undefined == tokenString) {
      return '';
    }
    const userToken = JSON.parse(tokenString);
    return userToken?.token;
  };

  const [token, setToken] = useState(getToken());

  const saveToken = (userToken) => {
    localStorage.setItem('token', JSON.stringify(userToken));
    setToken(userToken.token);
  };

  return {
    setToken: saveToken,
    token,
  };
}
