import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Auren — Plataforma de Salud Mental",
  description:
    "Plataforma SaaS de salud mental para consultas, centros y hospitales. Gestión clínica, seguimiento de pacientes y análisis de evolución.",
  keywords: ["salud mental", "psicología", "psiquiatría", "gestión clínica", "pacientes"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
