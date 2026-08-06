import Link from 'next/link';

import { Button } from '@workspace/ui/components/button';
import { ArrowLeft, Compass } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';

export default function NotFound() {
  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-8xl font-bold tracking-tight">404</p>
            <h1 className="text-2xl font-bold">Page not found</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist
            </p>
            <Button asChild className="mt-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
