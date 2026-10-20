"use client";

import * as React from "react";
import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export type PasswordFieldProps = Omit<TextFieldProps, "type"> & {
  /**
   * Accessible label for the show/hide password toggle button.
   * If omitted, defaults to "Show password" when masked, and "Hide password" when revealed.
   */
  toggleAriaLabel?: string;
};

/**
 * PasswordField provides a standard password input field equipped with an eye icon
 * toggle button to allow users to reveal or mask their entered password.
 *
 * @param props TextFieldProps without the fixed 'type' prop, with optional toggleAriaLabel
 * @returns A fully accessible MUI TextField configured for password input with an eye toggle
 */
export const PasswordField = React.forwardRef<HTMLDivElement, PasswordFieldProps>(
  function PasswordField(
    {
      label = "Password",
      autoComplete = "current-password",
      slotProps,
      toggleAriaLabel,
      disabled,
      ...rest
    },
    ref
  ) {
    const [showPassword, setShowPassword] = React.useState(false);

    const handleClickToggle = () => {
      setShowPassword((prev) => !prev);
    };

    const handleMouseDownToggle = (
      event: React.MouseEvent<HTMLButtonElement>
    ) => {
      // Prevent loss of input focus on click
      event.preventDefault();
    };

    const ariaLabel =
      toggleAriaLabel || (showPassword ? "Hide password" : "Show password");

    return (
      <TextField
        {...rest}
        ref={ref}
        label={label}
        disabled={disabled}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        slotProps={{
          ...slotProps,
          input: (ownerState) => {
            const baseInputProps =
              typeof slotProps?.input === "function"
                ? slotProps.input(ownerState)
                : slotProps?.input;

            return {
              ...baseInputProps,
              endAdornment: (
                <>
                  {baseInputProps?.endAdornment}
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={ariaLabel}
                      onClick={handleClickToggle}
                      onMouseDown={handleMouseDownToggle}
                      edge="end"
                      size="small"
                      disabled={disabled}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                </>
              ),
            };
          },
        }}
      />
    );
  }
);

PasswordField.displayName = "PasswordField";
