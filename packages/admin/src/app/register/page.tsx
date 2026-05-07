"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { AuthTemplateRenderer } from "@/components/auth/AuthTemplateRenderer";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/local/register", {
        email,
        username,
        password,
        firstName: "",
        lastName: "",
      });
      const role = data.user?.role;
      if (role !== "admin" && role !== "superAdmin") {
        setError(
          `Your account was created with role "${role || "authenticated"}". Only the first registered user gets admin access automatically. Ask an existing admin to promote your account.`,
        );
        return;
      }
      login(data.jwt, data.user);
      router.replace("/");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthTemplateRenderer
      mode="register"
      email={email}
      setEmail={setEmail}
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
