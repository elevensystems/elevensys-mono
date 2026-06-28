'use client';

import Link from 'next/link';

import clsx from 'clsx';
import { BadgeCheck, KeyRound, Mail, Users } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { useAuth } from '@/contexts/auth-context';

function getUserInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  pro: 'Pro',
  free: 'Free',
};

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <MainLayout>
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground mb-4">
              You must be signed in to view your profile.
            </p>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-5">
                <Avatar className="h-16 w-16 rounded-xl">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback
                    className={clsx('rounded-xl text-lg font-semibold', {
                      'bg-color-14 text-white': user.role === 'pro',
                    })}
                  >
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold truncate">
                    {user.name}
                  </h1>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant={user.role === 'free' ? 'secondary' : 'default'}
                      className={clsx({
                        'bg-color-14 hover:bg-color-14/80 text-white':
                          user.role === 'pro',
                      })}
                    >
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <BadgeCheck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="text-sm">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <KeyRound className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="text-sm font-mono break-all">{user.sub}</p>
                </div>
              </div>
              {user.groups.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Groups</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {user.groups.map(group => (
                          <Badge
                            key={group}
                            variant="outline"
                            className="text-xs"
                          >
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
