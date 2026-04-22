import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AS WORLD TECH Stock",
  description:
    "Interface de gestion de stock minimaliste pour AS WORLD TECH, entre ASUKA SPIRIT et Docteur Asuka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.variable}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
