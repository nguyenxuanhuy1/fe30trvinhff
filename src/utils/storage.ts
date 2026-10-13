const accessTokenKey = "access_token";

const storage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(accessTokenKey);
  },
  setAccessToken: (token: string): void => {
    window.localStorage.setItem(accessTokenKey, token);
  },
  removeAccessToken: (): void => {
    window.localStorage.removeItem(accessTokenKey);
  },
};

export { accessTokenKey, storage };
