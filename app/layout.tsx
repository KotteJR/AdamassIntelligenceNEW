import type { Metadata } from "next";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adamass Console",
  description: "Notebook-style console for company analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-screen h-full antialiased">
        <ThemeProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
