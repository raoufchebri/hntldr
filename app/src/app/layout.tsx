import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import Disclaimer from "@/components/Disclaimer";
import DismissibleDisclaimer from "@/components/DismissibleDisclaimer";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HNTLDR - Unofficial Hacker News Audio Summaries",
  description: "Listen to unofficial audio summaries of top Hacker News stories. Not affiliated with Hacker News or Y Combinator.",
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} transition-colors duration-300 bg-primary text-primary pixel-pattern`}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <header className="bg-muted py-4 border-b-3 border-dashed border-primary">
              <div className="container mx-auto px-4 flex justify-between items-center">
                <div className="flex items-center">
                  <Link href="/">
                    <h1 className="text-2xl font-pixel-bold text-primary hover:text-orange-500 transition-colors">HNTLDR</h1>
                  </Link>
                  <span className="ml-2 text-xs font-pixel text-muted">(Unofficial)</span>
                  <nav className="ml-8 hidden md:flex space-x-4">
                    <Link href="/">
                      <span className="font-pixel text-primary hover:text-orange-500 transition-colors">All Episodes</span>
                    </Link>
                    <Link href="/latest">
                      <span className="font-pixel text-primary hover:text-orange-500 transition-colors">Latest Episode</span>
                    </Link>
                  </nav>
                </div>
                <ThemeToggle />
              </div>
            </header>
            
            <main className="flex-grow">
              {children}
            </main>
            
            <footer className="bg-muted py-6 border-t-3 border-dashed border-primary">
              <div className="container mx-auto px-4">
                <div className="mb-6">
                  <Disclaimer />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-pixel text-primary">HNTLDR</h2>
                    <p className="font-pixel text-muted">Hacker News Too Long; Didn&apos;t Read</p>
                  </div>
                  <div>
                    <p className="font-pixel text-muted">© {new Date().getFullYear()} HNTLDR. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </footer>
            
            {/* Dismissible disclaimer that appears at the bottom of the page */}
            <DismissibleDisclaimer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
