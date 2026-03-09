import React from "react";
import "../globals.css";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <nav>
          <p>navbar - Ana Sayfa Layout</p>
        </nav>
        <main>{children}</main>
        <footer>
          <p>footer - Ana Sayfa Layout</p>
        </footer>
      </body>
    </html>
  );
}
