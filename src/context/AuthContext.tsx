import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  apiFetch,
  AUTH_EXPIRED_EVENT,
  clearToken,
  setToken,
  type ApiClientError,
} from '../api/client';
import type { UserInfo } from '../api/types';
import {
  getMeetingAuthTokenFromEvent,
  isEmbeddedMeeting,
  postMeetingAuthMessage,
} from '../lib/embeddedAuth';

interface AuthContextValue {
  user: UserInfo | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await apiFetch<UserInfo>('/auth/me');
      setUser(me);
    } catch (e) {
      const err = e as ApiClientError;
      if (err.status === 401) {
        clearToken();
      }
      setUser(null);
      throw e;
    }
  }, []);

  useEffect(() => {
    let handshakeTimeout: number | undefined;
    let disposed = false;
    const embedded = isEmbeddedMeeting();

    const handleAuthExpired = () => {
      clearToken();
      setUser(null);
      setLoading(false);
      if (embedded) {
        postMeetingAuthMessage('MEETING_AUTH_EXPIRED');
      }
    };

    const handleParentMessage = async (event: MessageEvent) => {
      const token = getMeetingAuthTokenFromEvent(event);
      if (!token) {
        return;
      }

      if (handshakeTimeout !== undefined) {
        window.clearTimeout(handshakeTimeout);
      }
      setLoading(true);
      setToken(token);

      try {
        await refresh();
        if (!disposed) {
          postMeetingAuthMessage('MEETING_AUTH_ACCEPTED');
        }
      } catch {
        clearToken();
        if (!disposed) {
          setUser(null);
          postMeetingAuthMessage('MEETING_AUTH_REJECTED');
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    if (embedded) {
      window.addEventListener('message', handleParentMessage);
      handshakeTimeout = window.setTimeout(() => {
        if (!disposed) {
          setLoading(false);
        }
      }, 5000);
      postMeetingAuthMessage('MEETING_AUTH_READY');
    } else {
      refresh()
        .catch(() => undefined)
        .finally(() => {
          if (!disposed) {
            setLoading(false);
          }
        });
    }

    return () => {
      disposed = true;
      if (handshakeTimeout !== undefined) {
        window.clearTimeout(handshakeTimeout);
      }
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      window.removeEventListener('message', handleParentMessage);
    };
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiFetch<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearToken();
      setUser(null);
      if (isEmbeddedMeeting()) {
        postMeetingAuthMessage('MEETING_AUTH_LOGOUT');
      }
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
