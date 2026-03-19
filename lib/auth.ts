const TOKEN_KEY = "token";
const USER_KEY = "user";
const COOKIE_TOKEN_NAME = "token";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** 从 localStorage 读取 token，服务端返回 null */
export function getToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** 从 localStorage 读取 user，服务端返回 null */
export function getUser(): AuthUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "id" in parsed &&
      "email" in parsed &&
      typeof (parsed as AuthUser).id === "string" &&
      typeof (parsed as AuthUser).email === "string"
    ) {
      return parsed as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

/** 保存登录态（仅客户端调用） */
export function setAuth(token: string, user: AuthUser): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

/** 退出登录：请求服务端撤销 refreshToken 并清 cookie，再清除本地 token/user */
export function logout(): void {
  if (!isBrowser()) return;
  try {
    fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = `${COOKIE_TOKEN_NAME}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // ignore
  }
}

/** 是否已登录（有 token 即视为已登录）。当前仅做存在性校验，后续可扩展为 JWT 解析与过期校验。 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/** 判断是否存在 token（与 isAuthenticated 同义） */
export function isLoggedIn(): boolean {
  return !!getToken();
}

/** 获取当前用户角色，未登录或无 role 返回 null */
export function getUserRole(): string | null {
  const user = getUser();
  return user?.role ?? null;
}

/** 是否为管理员 */
export function isAdmin(): boolean {
  return getUserRole() === "admin";
}

/** 当前用户是否拥有给定角色之一 */
export function hasRole(roles: string[]): boolean {
  const role = getUserRole();
  return role !== null && roles.includes(role);
}

/**
 * 预留：后续可在此做真正的 token 校验（如 JWT 解析、过期检查、服务端验证）。
 * 当前仅依赖 getToken() 存在性。
 */
export function verifyToken(_token: string | null): boolean {
  return !!_token;
}
