"use client";

import * as React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import BusinessIcon from "@mui/icons-material/Business";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ModuleNavItem } from "@/core/module-registry/types";

const DRAWER_WIDTH = 240;
const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <DashboardIcon fontSize="small" />,
  Leaderboard: <LeaderboardIcon fontSize="small" />,
  Business: <BusinessIcon fontSize="small" />,
};

type AppShellProps = {
  title: string;
  navItems: ModuleNavItem[];
  userName?: string | null;
  userEmail?: string | null;
  children: React.ReactNode;
};

/** Renders the responsive navigation shell for authenticated CRM pages. */
export function AppShell({ title, navItems, userName, userEmail, children }: AppShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();
  const identity = (userName || userEmail || "U").trim();

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ minHeight: { xs: 64, md: 70 }, px: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>CRM</Typography>
      </Toolbar>
      <Divider />
      <List sx={{ p: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <ListItemButton
              key={item.href}
              component={NextLink}
              href={item.href}
              selected={selected}
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemIcon>{iconMap[item.icon ?? ""] ?? <DashboardIcon fontSize="small" />}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 70 }, gap: 1 }}>
          {isMobile && <IconButton color="inherit" edge="start" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}><MenuIcon /></IconButton>}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>{title}</Typography>
          <Avatar sx={{ width: 34, height: 34 }}>{identity.slice(0, 2).toUpperCase()}</Avatar>
          {!isMobile && <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{userName}</Typography><Typography variant="caption">{userEmail}</Typography></Box>}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer variant="temporary" open={drawerOpen} onClose={() => setDrawerOpen(false)} slotProps={{ paper: { sx: { width: DRAWER_WIDTH } } }}>{drawer}</Drawer>
        ) : (
          <Drawer variant="permanent" slotProps={{ paper: { sx: { width: DRAWER_WIDTH } } }}>{drawer}</Drawer>
        )}
      </Box>
      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: { xs: 8, md: "70px" }, minHeight: "calc(100vh - 70px)" }}>
        {children}
      </Box>
    </Box>
  );
}
