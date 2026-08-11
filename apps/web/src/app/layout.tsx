import { Providers } from "@/components/providers";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AutoSOC",
  description: "Autonomous Security Operations Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
