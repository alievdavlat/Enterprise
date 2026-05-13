"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { AuthTemplateRenderer } from "@/components/auth/AuthTemplateRenderer";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pick up the JWT the OAuth callback shoves into the URL fragment, then
  // strip the fragment + reload the user from /auth/me. The token never
  // touches server logs (fragments stay client-side).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const match = hash.match(/(?:^#|&)token=([^&]+)/);
    if (!match) return;
    const token = decodeURIComponent(match[1]);
    (async () => {
      try {
        localStorage.setItem("token", token);
        const meRes = await api.get("/auth/me");
        const user = meRes.data?.data;
        if (!user) throw new Error("no user");
        if (user.role !== "admin" && user.role !== "superAdmin") {
          localStorage.removeItem("token");
          setError(`Admin access required. Your role is "${user.role}". Ask a super admin to grant access.`);
          return;
        }
        login(token, user);
        // Clear the fragment so a refresh doesn't try to repeat the flow.
        history.replaceState(null, "", window.location.pathname + window.location.search);
        router.replace("/");
      } catch {
        localStorage.removeItem("token");
        setError("SSO sign-in failed. Try again or use email/password.");
      }
    })();
  }, [login, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/local", {
        identifier,
        password,
      });
      const role = data.user?.role;
      if (role !== "admin" && role !== "superAdmin") {
        setError(
          `Admin access required. Your account role is "${role || "unknown"}". Contact a super admin to get admin access.`,
        );
        return;
      }
      login(data.jwt, data.user);
      router.replace("/");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthTemplateRenderer
        mode="login"
        email={identifier}
        setEmail={setIdentifier}
        password={password}
        setPassword={setPassword}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        footer={<SocialLoginButtons />}
      />
    </>
  );
}
