"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, setAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuth(data.token, data.user);
        router.replace("/dashboard");
      } else {
        setError(data.message || "登录失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f5f5f5" }}>
      <div style={{ width: "100%", maxWidth: 360, padding: 32, background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600, textAlign: "center" }}>景峻 CRM</h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#666", textAlign: "center" }}>登录后台管理系统</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="email" style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="admin@crm.com"
              autoComplete="email"
              style={{ width: "100%", boxSizing: "border-box", height: 40, padding: "8px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 6 }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="请输入密码"
              autoComplete="current-password"
              style={{ width: "100%", boxSizing: "border-box", height: 40, padding: "8px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 6 }}
            />
          </div>

          {error ? (
            <p style={{ margin: 0, fontSize: 14, color: "#c00" }} role="alert">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            style={{ height: 40, fontSize: 14, fontWeight: 500, color: "#fff", background: "#000", border: "none", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </div>
      </div>
    </div>
  );
}
