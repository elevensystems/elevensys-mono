'use client';

import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form';
import AuthLayout from '@/components/layouts/auth-layout';

export default function ForgotPassword() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
