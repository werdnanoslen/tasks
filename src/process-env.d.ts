declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MYSQL_HOST: string;
      MYSQL_USER: string;
      MYSQL_PASSWORD: string;
      MYSQL_DATABASE: string;
      PORT: number;
      REACT_APP_BASE_URL: string;
      REACT_APP_SERVER_PORT: number;
      TOKEN_SECRET: jwt.Secret;
    }
  }
}
export {};
