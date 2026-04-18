'use client';

import { SignupForm } from '@/components/features/auth/signup-form';
import AuthLayout from '@/components/layouts/auth-layout';

export default function SignUp() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
