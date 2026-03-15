import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enterprise CMS Admin",
  description: "Enterprise Headless CMS Administration Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background font-sans antialiased selection:bg-primary/20`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGuard>
            <AdminLayout>{children}</AdminLayout>
          </AuthGuard>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
