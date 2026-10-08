'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';

interface PathBreadcrumbProps {
  /** Segments that group pages but have no page of their own: shown, not linked. */
  groupOnlySegments?: ReadonlySet<string>;
}

const formatSegment = (segment: string) =>
  segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** The header breadcrumb every app derives from the current path: Home › Foo › Bar. */
export function PathBreadcrumb({ groupOnlySegments }: PathBreadcrumbProps) {
  const pathSegments = usePathname().split('/').filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = '/' + pathSegments.slice(0, index + 1).join('/');

          return (
            <div key={href} className="contents">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
                ) : groupOnlySegments?.has(segment) ? (
                  <span className="hidden md:block">
                    {formatSegment(segment)}
                  </span>
                ) : (
                  <BreadcrumbLink asChild className="hidden md:block">
                    <Link href={href}>{formatSegment(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
