// Environment variables type declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      ENABLE_AUDIT_LOGGING: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_SSL: string;
      NODE_ENV: string;
      PORT: string;
    }
  }
}

export {};
