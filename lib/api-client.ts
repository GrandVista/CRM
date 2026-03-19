import { getToken, setAuth, logout } from "@/lib/auth";

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return defaultHeaders;
  const token = getToken();
  if (!token) return defaultHeaders;
  return {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * 带鉴权的 fetch：自动从 localStorage 读取 token 并设置 Authorization: Bearer xxx。
 * 若返回 401，会尝试调用 POST /api/refresh（带 cookie），成功则更新 token 并重试原请求一次；
 * refresh 失败则清除登录态并跳转 /login。
 * 仅可在浏览器环境使用。
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const base = getBaseUrl();
  const doOne = (): Promise<Response> => {
    const headers = new Headers(init?.headers);
    const authHeaders = getAuthHeaders();
    Object.entries(authHeaders).forEach(([k, v]) => headers.set(k, v));
    return fetch(input, {
      ...init,
      headers,
      credentials: "include",
    });
  };

  let res = await doOne();
  if (res.status === 401 && typeof window !== "undefined") {
    const refreshRes = await fetch(`${base}/api/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!refreshRes.ok) {
      logout();
      window.location.replace("/login");
      return res;
    }
    const data = (await refreshRes.json()) as { token: string; user: { id: string; email: string; name: string | null; role: string } };
    if (data.token && data.user) {
      setAuth(data.token, data.user);
      res = await doOne();
    }
  }
  return res;
}
