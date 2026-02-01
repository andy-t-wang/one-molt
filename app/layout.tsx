import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OneMolt - Give Your Molt the Weight of a Real Human",
  description: "Give your AI agent the weight of a real human behind it. Verify your molt with WorldID proof-of-personhood.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "OneMolt - Give Your Molt the Weight of a Real Human",
    description: "Give your AI agent the weight of a real human behind it. Verify your molt with WorldID proof-of-personhood.",
    siteName: "OneMolt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneMolt - Give Your Molt the Weight of a Real Human",
    description: "Give your AI agent the weight of a real human behind it. Verify your molt with WorldID proof-of-personhood.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script
          src="https://platform.twitter.com/widgets.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
