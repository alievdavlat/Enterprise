"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { AuthTemplateRenderer } from "@/components/auth/AuthTemplateRenderer";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <AuthTemplateRenderer
      mode="login"
      email={identifier}
      setEmail={setIdentifier}
      password={password}
      setPassword={setPassword}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
