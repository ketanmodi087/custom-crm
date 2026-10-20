"use client";

import {
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Typography,
} from "@mui/material";
import NextLink from "next/link";

type Crumb = { label: string; href?: string };

type Props = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
};

export const PageHeader = ({ title, subtitle, breadcrumbs, actions }: Props) => (
  <Box
    sx={{
      display: "flex",
      alignItems: { xs: "stretch", sm: "flex-start" },
      justifyContent: "space-between",
      flexDirection: { xs: "column", sm: "row" },
      gap: 2,
      mb: 3,
    }}
  >
    <Box>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb) =>
            crumb.href ? (
              <MuiLink
                key={crumb.label}
                component={NextLink}
                href={crumb.href}
                underline="hover"
                color="inherit"
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={crumb.label} color="text.primary">
                {crumb.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box>}
  </Box>
);
