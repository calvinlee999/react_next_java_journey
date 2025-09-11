import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/store/providers/store-provider";
import { NavigationProgress } from "@/components/navigation/smart-navigation";
import { NavigationMenu } from "@/components/navigation/navigation-menu";
import { PerformanceMonitor } from "@/components/optimization/virtual-dom-optimizations";
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "React Next.js Journey - Enterprise Grade App",
  description: "Modern React application with Next.js, featuring advanced routing, state management, and Virtual DOM optimizations",
  keywords: ["React", "Next.js", "TypeScript", "Virtual DOM", "State Management"],
  authors: [{ name: "Enterprise Development Team" }],
  viewport: "width=device-width, initial-scale=1",
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
        <ServiceWorkerProvider>
          <StoreProvider>
            <PerformanceMonitor>
              <NavigationProgress />
              <NavigationMenu />
              <main>
                {children}
              </main>
            </PerformanceMonitor>
          </StoreProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
