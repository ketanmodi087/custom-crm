"use client";

import * as React from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordField } from "@/shared/components/PasswordField";

/** Renders the email/password CRM sign-in form. */
export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/dashboard");
    router.refresh();
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2, bgcolor: "background.default" }}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>CRM</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sign in to manage customer relationships.</Typography>
          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            <PasswordField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
            <Typography component={Link} href="/forgot-password" variant="body2" color="primary.main" sx={{ textDecoration: "none", alignSelf: "flex-end" }}>Forgot password?</Typography>
            <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
