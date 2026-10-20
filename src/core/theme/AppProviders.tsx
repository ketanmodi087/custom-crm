"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { SessionProvider } from "next-auth/react";
import { appTheme } from "./theme";

type Props = {
  children: React.ReactNode;
};

export const AppProviders = ({ children }: Props) => (
  <AppRouterCacheProvider>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  </AppRouterCacheProvider>
);
