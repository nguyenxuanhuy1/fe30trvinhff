declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NEXT_PUBLIC_API_URL?: string;
      readonly NEXT_PUBLIC_APP_NAME?: string;
      readonly NEXT_PUBLIC_SITE_URL?: string;
    }
  }
}

export {};
