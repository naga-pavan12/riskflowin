"use client";

import { useTheme } from "next-themes"; // Re-import to trigger TS check
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}

      {...props}
    />
  );
};

export { Toaster };
