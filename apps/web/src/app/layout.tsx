import "./globals.css";
import { ReactNode } from "react";
import { QueryProvider } from "@/components/query-provider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
