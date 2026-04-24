import type { Metadata } from "next";
import { Comfortaa, Hind_Siliguri, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "@/app/globals.css";

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const brand = Comfortaa({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["400", "500", "600", "700"]
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body"
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
      <body suppressHydrationWarning className={`${heading.variable} ${brand.variable} ${body.variable} ${bangla.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
