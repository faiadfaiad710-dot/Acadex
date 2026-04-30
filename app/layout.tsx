import type { Metadata } from "next";
import { Comfortaa, Hind_Siliguri } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "@/app/globals.css";

const brand = Comfortaa({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["400", "500", "600", "700"]
});

const bangla = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  variable: "--font-bangla",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Acadex",
  description: "Cloud-based academic file management dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${brand.variable} ${bangla.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
