import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { configureAuthInterceptor } from "../services/apiClient.js";
import { getMe, login as loginRequest, logoutSession, refreshSession } from "../services/authApi.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const accessTokenRef = useRef(null);

  const setAccessToken = useCallback((nextAccessToken) => {
    accessTokenRef.current = nextAccessToken;
    setAccessTokenState(nextAccessToken);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, [setAccessToken]);

  const refresh = useCallback(async () => {
    try {
      const response = await refreshSession();
      const nextAccessToken = response.data.data.accessToken;

      setAccessToken(nextAccessToken);
      setUser(response.data.data.user);

      return nextAccessToken;
    } catch (error) {
      clearSession();
      return null;
    }
  }, [clearSession, setAccessToken]);

  const loadMe = useCallback(async () => {
    const response = await getMe();
    const nextUser = response.data.data.user;

    setUser(nextUser);

    return nextUser;
  }, []);

  useEffect(() => {
    configureAuthInterceptor({
      getToken: () => accessTokenRef.current,
      refreshToken: refresh
    });

    return () => {
      configureAuthInterceptor();
    };
  }, [refresh]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const nextAccessToken = await refresh();

      if (nextAccessToken) {
        try {
          await loadMe();
        } catch (error) {
          clearSession();
        }
      }

      if (isMounted) {
        setIsInitializing(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession, loadMe, refresh]);

  const login = useCallback(
    async (credentials) => {
      const response = await loginRequest(credentials);
      const nextAccessToken = response.data.data.accessToken;
      const nextUser = response.data.data.user;

      setAccessToken(nextAccessToken);
      setUser(nextUser);

      return { accessToken: nextAccessToken, user: nextUser };
    },
    [setAccessToken]
  );

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isInitializing,
      loadMe,
      login,
      logout,
      refresh,
      user
    }),
    [accessToken, isInitializing, loadMe, login, logout, refresh, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
