import React from "react";
import "../globals.css";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <nav>
          <p>Users Navbar - Farklı Layout</p>
        </nav>
        <main>{children}</main>
        <footer>
          <p>Users Footer - Farklı Layout</p>
        </footer>
      </body>
    </html>
  );
}
