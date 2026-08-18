import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Friend Connector - WhatsApp Group Contact Extractor",
  description: "Extract contacts from WhatsApp groups and send connect messages to make new friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
