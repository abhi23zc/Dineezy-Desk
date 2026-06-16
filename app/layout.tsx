import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://desk.dineezy.com";
const APP_NAME = "Dineezy Desk";
const APP_DESCRIPTION =
  "Dineezy Desk — A minimalist project management workspace for high-performance teams. Manage tasks, modules, and projects beautifully.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "project management",
    "task manager",
    "team collaboration",
    "productivity",
    "dineezy",
    "workspace",
    "modules",
    "task tracking",
  ],
  authors: [{ name: "Dineezy", url: APP_URL }],
  creator: "Dineezy",
  publisher: "Dineezy",
  robots: {
    index: false, // App is behind auth — tell crawlers not to index
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [
      { url: "/Dineezy_desk_logo_white_bg.png", type: "image/png" },
    ],
    shortcut: "/Dineezy_desk_logo_white_bg.png",
    apple: [
      { url: "/Dineezy_desk_logo_white_bg.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/Dineezy_desk_logo_white_bg.png",
        width: 512,
        height: 512,
        alt: "Dineezy Desk Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/Dineezy_desk_logo_white_bg.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
