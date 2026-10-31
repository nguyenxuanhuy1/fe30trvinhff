declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NEXT_PUBLIC_SITE_URL: string;
    }
  }
}

export {};
