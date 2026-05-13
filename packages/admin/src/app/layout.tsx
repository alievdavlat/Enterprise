import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Toaster, TooltipProvider } from "@enterprise/design-system";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enterprise CMS Admin",
  description: "Enterprise Headless CMS Administration Panel",
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
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
          <TooltipProvider>
            <AuthGuard>
              <QueryProvider>
                <AdminLayout>{children}</AdminLayout>
              </QueryProvider>
            </AuthGuard>
            <Toaster
              position="top-right"
              richColors
              closeButton
              expand
              toastOptions={{
                classNames: {
                  toast: "border-border/60 shadow-lg backdrop-blur",
                  success: "!bg-emerald-50 dark:!bg-emerald-950/30",
                  error: "!bg-red-50 dark:!bg-red-950/30",
                },
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
