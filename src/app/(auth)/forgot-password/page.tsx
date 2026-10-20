'use client';

import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import Link from 'next/link';

/** Renders the password-reset request form. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'Failed to send reset email');
      }
    } catch {
      setStatus('error');
      setMessage('An unexpected error occurred');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Forgot Password
        </Typography>
        
        {status === 'success' ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Button component={Link} href="/login" fullWidth variant="outlined">
              Back to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </Typography>

            {status === 'error' && (
              <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              disabled={status === 'loading'}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/login" style={{ textDecoration: 'none', color: '#1976d2', fontSize: '0.875rem' }}>
                Back to Login
              </Link>
            </Box>
          </form>
        )}
      </Paper>
    </Box>
  );
}
