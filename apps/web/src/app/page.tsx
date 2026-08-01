'use client';

import Link from 'next/link';

import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
  ArrowRight,
  Braces,
  Key,
  Link2,
  ScanSearch,
  Sparkles,
  Wrench,
} from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { APP_NAME } from '@/lib/constants';

const quickTools = [
  { name: 'JSON Diffinity', href: '/tools/json-diffinity', icon: Braces },
  { name: 'JSON Objectify', href: '/tools/json-objectify', icon: Sparkles },
  { name: 'JSON Lens', href: '/tools/json-lens', icon: ScanSearch },
  { name: 'Urlify', href: '/tools/urlify', icon: Link2 },
  { name: 'Passly', href: '/tools/passly', icon: Key },
] as const;

export default function Home() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to {APP_NAME}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              A suite of developer tools — all in one place.
            </p>
          </div>

          {/* Quick Tools */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Quick Tools</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tools">
                  View all tools
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {quickTools.map(tool => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} href={tool.href}>
                    <Card className="h-full text-center hover:shadow-md transition-all cursor-pointer py-5">
                      <CardContent className="flex flex-col items-center gap-2 p-0">
                        <Icon className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{tool.name}</span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
