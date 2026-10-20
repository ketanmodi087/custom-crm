'use client';

import { useState, Suspense } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { PasswordField } from '@/shared/components/PasswordField';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }
    
    setStatus('loading');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage('Password has been reset successfully. You can now login.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'Failed to reset password');
      }
    } catch {
      setStatus('error');
      setMessage('An unexpected error occurred');
    }
  };

  if (!email || !token) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {message || 'Invalid or missing reset token.'}
        </Alert>
        <Button component={Link} href="/forgot-password" fullWidth variant="outlined">
          Request New Link
        </Button>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
        <Button component={Link} href="/login" fullWidth variant="contained">
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {status === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
      )}

      <TextField
        fullWidth
        label="Email Address"
        type="email"
        value={email}
        disabled
        margin="normal"
      />
      
      <PasswordField
        fullWidth
        label="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        margin="normal"
        disabled={status === 'loading'}
        autoComplete="new-password"
      />
      
      <PasswordField
        fullWidth
        label="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        margin="normal"
        disabled={status === 'loading'}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        sx={{ mt: 3 }}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Resetting...' : 'Reset Password'}
      </Button>
    </form>
  );
}

/** Renders the token-based password reset form. */
export default function ResetPasswordPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Set New Password
        </Typography>
        <Suspense fallback={<Typography align="center">Loading...</Typography>}>
          <ResetPasswordForm />
        </Suspense>
      </Paper>
    </Box>
  );
}
