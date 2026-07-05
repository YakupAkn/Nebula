"use client"; // <--- BU SATIRI EKLEMEN ŞART

import Script from "next/script";
import { ThemeProvider } from "next-themes";
import "./globals.css";
// Metadata sunucu bileşenlerinde çalışır, istemci bileşenlerinde çalışmaz.
// Eğer Metadata kullanacaksan bu layout'u ikiye bölmen gerekebilir.
// Ama şimdilik sadece hatayı çözmek için bunu dene.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-X1BB1FB0MZ"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-X1BB1FB0MZ');
            `}
          </Script>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}