"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "12px",
          background: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "hsl(142 76% 36%)",
            secondary: "hsl(var(--card))",
          },
        },
        error: {
          iconTheme: {
            primary: "hsl(0 84% 60%)",
            secondary: "hsl(var(--card))",
          },
        },
      }}
    />
  );
}
