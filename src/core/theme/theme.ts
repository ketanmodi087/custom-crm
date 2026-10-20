import { createTheme } from "@mui/material/styles";
import { niceAdminLightShadows } from "./niceAdminShadows";

const primaryMain = "#165A50";
const secondaryMain = "#C2FD75";
const bgDefault = "#F5F5F5";
const bgPaper = "#ffffff";
const divider = "#030E091A";
const textPrimary = "#030E09CC";
const textSecondary = "#030e09b3";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: primaryMain,
      light: "#165a501a",
      dark: "#0f4438",
      contrastText: "#ffffff",
    },
    secondary: {
      main: secondaryMain,
      light: "#c2fd751a",
      dark: "#9ecc5e",
      contrastText: "#030E09",
    },
    success: {
      main: "#70C748",
      light: "#93D97326",
      contrastText: "#ffffff",
    },
    info: {
      main: "#539BFF",
      light: "#EBF3FE",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#F6B51E",
      light: "#F6B51E26",
      contrastText: "#ffffff",
    },
    error: {
      main: "#EF4444",
      light: "#EF444426",
      contrastText: "#ffffff",
    },
    background: {
      default: bgDefault,
      paper: bgPaper,
    },
    divider,
    text: {
      primary: textPrimary,
      secondary: textSecondary,
    },
    action: {
      disabledBackground: "rgba(73, 82, 88, 0.12)",
      hover: "#053b2514",
      hoverOpacity: 0.04,
    },
  },
  typography: {
    fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
    h1: { fontWeight: 600, fontSize: "2.25rem", lineHeight: "2.75rem" },
    h2: { fontWeight: 600, fontSize: "1.875rem", lineHeight: "2.25rem" },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.3125rem", lineHeight: "1.6rem" },
    h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: "1.6rem" },
    h6: { fontWeight: 600, fontSize: "1rem", lineHeight: "1.2rem" },
    subtitle1: { fontSize: "0.875rem", fontWeight: 400 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 400 },
    body1: { fontSize: "0.875rem", fontWeight: 400, lineHeight: "1.334rem" },
    body2: { fontSize: "0.75rem", fontWeight: 400, lineHeight: "1rem" },
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  shadows: [...niceAdminLightShadows],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: bgDefault,
        },
        "::selection": {
          backgroundColor: secondaryMain,
          color: "#030E09",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          boxShadow: "none",
        },
        contained: {
          "&:hover": { boxShadow: "none" },
        },
        text: {
          padding: "5px 15px",
          "&:hover": {
            boxShadow: "none",
            backgroundColor: "#165a501a",
            color: primaryMain,
          },
        },
      },
      variants: [
        {
          props: { variant: "contained", color: "secondary" },
          style: {
            color: "#030E09",
          },
        },
      ],
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiFormControl: {
      defaultProps: { size: "small" },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          width: "100%",
          backgroundImage: "none",
          boxShadow: niceAdminLightShadows[9],
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          "&:last-child": { paddingBottom: 24 },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: bgPaper,
          color: textPrimary,
          borderBottom: `1px solid ${divider}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${divider}`,
          backgroundColor: bgPaper,
          color: textPrimary,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginBottom: 4,
          "&:hover": {
            backgroundColor: "#165a501a",
          },
          "&.Mui-selected": {
            backgroundColor: "#165a501a",
            color: primaryMain,
            "&:hover": {
              backgroundColor: "#165a5026",
            },
            "& .MuiListItemIcon-root": {
              color: primaryMain,
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: textSecondary,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#165a501a",
            color: primaryMain,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.75rem",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          minHeight: 44,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.25rem",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: niceAdminLightShadows[9],
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${divider}`,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 600,
            color: textPrimary,
            backgroundColor: bgPaper,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": {
            borderBottom: 0,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: divider,
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
});
