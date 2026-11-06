import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Azulito Labs — From Prompt to Product",
  description:
    "AI products, intelligent agents, automation systems and creative tools by Azulito Labs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
