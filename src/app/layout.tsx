import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/core/theme/AppProviders";
import "@/config/modules";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CRM",
  description: "Customer relationship management",
};

/** Provides the global theme and document metadata for every application route. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`}>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
