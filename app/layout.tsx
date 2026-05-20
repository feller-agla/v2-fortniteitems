import type { Metadata } from "next";
import "./globals.css";
import { CreatorCodeProvider } from "./context/CreatorCodeContext";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "LamaShop - Boutique V-Bucks",
  description: "Achetez vos V-Bucks et packs Fortnite au meilleur prix.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-fortnite-blue text-white overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <CreatorCodeProvider>
            {children}
          </CreatorCodeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
