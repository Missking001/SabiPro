import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "SabiPro — Find Trusted Local Service Providers in Nigeria",
  description:
    "Connect with vetted local tradespeople in Nigerian cities. Search plumbers, electricians, mechanics, and more on SabiPro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-surface-bg">{children}</main>
          <BottomNav />
          <ConditionalFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
