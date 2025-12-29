declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MYSQL_HOST: string;
      MYSQL_USER: string;
      MYSQL_PASSWORD: string;
      MYSQL_DATABASE: string;
      NODE_ENV: string;
      APP_PORT: number;
      SERVER_PORT: number;
      BASE_URL: string;
      TOKEN_SECRET: jwt.Secret;
      UPLOAD_PATH: string;
      UPLOAD_WEBROOT: string;
      ALLOWED_ORIGINS: string;
    }
  }
}
export {};
