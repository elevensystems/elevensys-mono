# Next.js Framework Documentation

## Introduction

Next.js is a powerful React framework for building full-stack web applications developed by Vercel.
This documentation covers Next.js version 16.1.1, which extends React's capabilities with features
like server-side rendering (SSR), static site generation (SSG), and hybrid approaches, all optimized
through Rust-based JavaScript tooling for high-performance builds. Next.js enables developers to
create production-ready applications with automatic code splitting, built-in routing, API routes,
and seamless integration between frontend and backend code. The framework supports both the modern
App Router (introduced in Next.js 13 and continuously refined through version 16) and the
traditional Pages Router, offering flexibility for different project needs. Version 16 introduces
stable support for the Form component, enhanced caching with cacheLife() and cacheTag() APIs, new
revalidation methods including updateTag() and refresh(), and improved developer experience with
better TypeScript integration and performance optimizations.

Next.js addresses common challenges in modern web development by providing solutions for routing,
data fetching, image optimization, internationalization, and SEO out of the box. It supports React
Server Components for efficient server-side rendering, Client Components for interactive UI, and
Server Actions for server-side mutations without needing separate API endpoints. The framework's
architecture is designed to enable optimal performance with automatic optimizations like lazy
loading, prefetching, and intelligent caching strategies while maintaining developer productivity
through conventions and best practices. Version 16 brings significant improvements including the
stable Form component for progressive enhancement, cacheLife() for declarative cache control with
predefined profiles (seconds, minutes, hours, days, weeks, max), cacheTag() for granular cache
invalidation, enhanced metadata API for comprehensive SEO control, and improved support for React 19
features. Whether building marketing sites, e-commerce platforms, dashboards, or content-heavy
applications, Next.js 16 provides the APIs and patterns to build performant, scalable applications.

## Core APIs and Functions

### App Router - Basic Page Structure

The App Router uses a file-system based routing where folders define routes and special files
(page.tsx, layout.tsx) define UI components.

```typescript
// app/page.tsx
export default function Page() {
  return <h1>Hello, Next.js!</h1>;
}

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Form Component - Progressive Enhancement

Next.js 16 introduces a built-in Form component that provides progressive enhancement for forms with
Server Actions.

```typescript
// app/users/new/page.tsx
import Form from "next/form";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default function NewUser() {
  async function createUser(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    await prisma.user.create({
      data: { name, email },
    });

    redirect("/");
  }

  return (
    <div>
      <h1>Create New User</h1>
      <Form action={createUser}>
        <label htmlFor="name">Name</label>
        <input type="text" id="name" name="name" required />

        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" required />

        <button type="submit">Create User</button>
      </Form>
    </div>
  );
}

// With revalidation
// app/posts/new/page.tsx
import Form from "next/form";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default function NewPost() {
  async function createPost(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    await db.posts.create({
      data: { title, content },
    });

    revalidatePath("/posts");
    redirect("/posts");
  }

  return (
    <Form action={createPost}>
      <input type="text" name="title" required />
      <textarea name="content" rows={6} />
      <button type="submit">Create Post</button>
    </Form>
  );
}
```

### Cache Management with cacheLife() and cacheTag()

Next.js 16 introduces cacheLife() for declarative cache control and cacheTag() for granular cache
invalidation.

```typescript
// lib/data.ts
'use cache';

import { cacheLife, cacheTag } from 'next/cache';
import { refresh, revalidateTag, updateTag } from 'next/cache';

// lib/data.ts

// Use predefined cache profiles
export async function getProducts() {
  'use cache';
  cacheLife('hours'); // Cache for 1 hour with 5 min stale time
  cacheTag('products');

  const response = await fetch('https://api.example.com/products');
  return response.json();
}

// Custom cache configuration
export async function getUserData(userId: string) {
  'use cache';
  cacheLife({
    stale: 60, // 1 minute stale
    revalidate: 300, // 5 minutes revalidate
    expire: 3600, // 1 hour expire
  });
  cacheTag('user', `user-${userId}`);

  const response = await fetch(`https://api.example.com/users/${userId}`);
  return response.json();
}

// Different cache profiles available:
// - "seconds": stale: 30s, revalidate: 1s, expire: 1m
// - "minutes": stale: 5m, revalidate: 1m, expire: 1h
// - "hours": stale: 5m, revalidate: 1h, expire: 1d
// - "days": stale: 5m, revalidate: 1d, expire: 1w
// - "weeks": stale: 5m, revalidate: 1w, expire: 30d
// - "max": stale: 5m, revalidate: 30d, expire: never
// - "default": stale: 5m, revalidate: 15m, expire: never

// Server Action using new cache APIs
// app/actions.ts
('use server');

export async function updateProduct(productId: string, data: any) {
  await db.products.update(productId, data);

  // Revalidate all caches with this tag
  revalidateTag('products');
  revalidateTag(`product-${productId}`);

  // Or use updateTag for more granular control
  updateTag(`product-${productId}`);

  return { success: true };
}

export async function refreshData() {
  // Refresh all data on the current page
  refresh();
}
```

### Request APIs - headers(), cookies(), and draftMode()

Access request information in Server Components and Route Handlers using synchronous APIs.

```typescript
// app/dashboard/page.tsx
import { cookies, headers } from 'next/headers';

export default function DashboardPage() {
  // Access cookies
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');

  // Access headers
  const headersList = headers();
  const userAgent = headersList.get('user-agent');

  return (
    <div>
      <h1>Dashboard</h1>
      <p>User Agent: {userAgent}</p>
      <p>Token: {token?.value}</p>
    </div>
  );
}

// Route Handler with request APIs
// app/api/user/route.ts
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get('session');

  const headersList = headers();
  const authorization = headersList.get('authorization');

  return NextResponse.json({
    session: session?.value,
    auth: authorization
  });
}

// Draft Mode for CMS preview
// app/api/draft/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  // Enable draft mode
  draftMode().enable();

  // Redirect to the preview page
  redirect(`/posts/${slug}`);
}

// Check draft mode in page
// app/posts/[slug]/page.tsx
import { draftMode } from 'next/headers';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { isEnabled } = draftMode();

  const post = await getPost(params.slug, isEnabled);

  return (
    <article>
      {isEnabled && <p>Draft mode is enabled</p>}
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### Dynamic Routes with generateStaticParams

Create dynamic routes and pre-render pages at build time using generateStaticParams for static site
generation.

```typescript
// app/posts/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/api";

export default async function Post({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");

  return (
    <main>
      <article className="mb-32">
        <PostHeader
          title={post.title}
          coverImage={post.coverImage}
          date={post.date}
          author={post.author}
        />
        <PostBody content={content} />
      </article>
    </main>
  );
}

export async function generateMetadata({ params }: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const title = `${post.title} | Next.js Blog Example`;

  return {
    title,
    openGraph: {
      title,
      images: [post.ogImage.url],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

### Cache Management and Revalidation

Next.js 16 provides enhanced APIs for controlling cache behavior and revalidating data at runtime.

```typescript
// lib/data.ts
import { unstable_cache } from 'next/cache';
// Opt out of caching for dynamic data
import { unstable_noStore } from 'next/cache';
import { refresh, revalidatePath, revalidateTag, updateTag } from 'next/cache';

// Cache function results with tags
export const getProducts = unstable_cache(
  async () => {
    const response = await fetch('https://api.example.com/products');
    return response.json();
  },
  ['products'], // cache key
  {
    tags: ['products-list'],
    revalidate: 3600, // revalidate every hour
  }
);

export async function getUserData(userId: string) {
  unstable_noStore(); // This data should never be cached
  const response = await fetch(`https://api.example.com/users/${userId}`);
  return response.json();
}

// Server Action to revalidate cache
// app/actions.ts
('use server');

export async function updateProduct(formData: FormData) {
  const productId = formData.get('productId') as string;

  // Update product in database
  await db.products.update(productId, {
    name: formData.get('name') as string,
    price: parseFloat(formData.get('price') as string),
  });

  // Revalidate specific path
  revalidatePath('/products');
  revalidatePath(`/products/${productId}`);

  // Or revalidate by tag
  revalidateTag('products-list');

  // Or use updateTag for more granular control
  updateTag('products-list');

  // Or refresh the current page
  refresh();

  return { success: true };
}
```

### Internationalization with Dynamic Routes

Implement i18n by using dynamic route segments and generateStaticParams to create localized pages.

```typescript
// app/[lang]/layout.tsx
import { i18n, type Locale } from "@/i18n-config";

export const metadata = {
  title: "i18n within app router - Vercel Examples",
  description: "How to do i18n in Next.js 16 within app router",
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default function Root({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: Locale };
}) {
  return (
    <html lang={params.lang}>
      <body>{children}</body>
    </html>
  );
}

// app/[lang]/page.tsx
import { getDictionary } from './dictionaries';

export default async function Page({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = await getDictionary(lang);

  return (
    <div>
      <h1>{dict.home.title}</h1>
      <p>{dict.home.description}</p>
    </div>
  );
}

// i18n-config.ts
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'de', 'fr', 'es'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

// dictionaries.ts
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  de: () => import('./dictionaries/de.json').then((module) => module.default),
  fr: () => import('./dictionaries/fr.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => dictionaries[locale]();
```

### API Routes - App Router Style

Create API endpoints using Route Handlers with route.ts/route.js files supporting HTTP methods.

```typescript
// app/api/set-token/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  const res = NextResponse.json({ message: 'successful' });
  res.cookies.set('token', 'this is a token');
  return res;
}

// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const headersList = headers();
  const secret = headersList.get("x-vercel-reval-key");

  if (secret !== process.env.CONTENTFUL_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("posts");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}

// Dynamic route handler
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await getPost(params.id);

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const post = await updatePost(params.id, body);

  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await deletePost(params.id);

  return NextResponse.json({ success: true });
}
```

### API Routes - Pages Router Style

Traditional API routes in the pages/api directory supporting various HTTP methods.

```typescript
// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
// pages/api/user/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

import type { User } from '../../../interfaces';
import type { User } from '../../interfaces';

const users: User[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

export default function handler(_req: NextApiRequest, res: NextApiResponse<User[]>) {
  res.status(200).json(users);
}

export default function userHandler(req: NextApiRequest, res: NextApiResponse<User>) {
  const { query, method } = req;
  const id = parseInt(query.id as string, 10);
  const name = query.name as string;

  switch (method) {
    case 'GET':
      res.status(200).json({ id, name: `User ${id}` });
      break;
    case 'PUT':
      res.status(200).json({ id, name: name || `User ${id}` });
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

### Server Actions and Form Handling

Server Actions allow you to define server-side functions that can be called from Client Components,
perfect for form submissions and data mutations.

```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import postgres from "postgres";
import { z } from "zod";

let sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!, {
  ssl: "allow",
});

export async function createTodo(
  prevState: {
    message: string;
  },
  formData: FormData,
) {
  const schema = z.object({
    todo: z.string().min(1),
  });
  const parse = schema.safeParse({
    todo: formData.get("todo"),
  });

  if (!parse.success) {
    return { message: "Failed to create todo" };
  }

  const data = parse.data;

  try {
    await sql`
      INSERT INTO todos (text)
      VALUES (${data.todo})
    `;

    revalidatePath("/");
    return { message: `Added todo ${data.todo}` };
  } catch (e) {
    return { message: "Failed to create todo" };
  }
}

export async function deleteTodo(
  prevState: {
    message: string;
  },
  formData: FormData,
) {
  const schema = z.object({
    id: z.string().min(1),
    todo: z.string().min(1),
  });
  const data = schema.parse({
    id: formData.get("id"),
    todo: formData.get("todo"),
  });

  try {
    await sql`
      DELETE FROM todos
      WHERE id = ${data.id};
    `;

    revalidatePath("/");
    return { message: `Deleted todo ${data.todo}` };
  } catch (e) {
    return { message: "Failed to delete todo" };
  }
}

// Server Action with file upload
// app/upload/actions.ts
"use server";

import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save to public directory
  const path = join(process.cwd(), 'public', 'uploads', file.name);
  await writeFile(path, buffer);

  return { success: true, name: file.name };
}

// app/add-form.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createTodo } from "@/app/actions";

const initialState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Adding...' : 'Add'}
    </button>
  );
}

export function AddForm() {
  const [state, formAction] = useFormState(createTodo, initialState);

  return (
    <form action={formAction}>
      <label htmlFor="todo">Enter Task</label>
      <input type="text" id="todo" name="todo" required />
      <SubmitButton />
      <p aria-live="polite" role="status">
        {state?.message}
      </p>
    </form>
  );
}

// app/page.tsx
import postgres from "postgres";
import { AddForm } from "@/app/add-form";
import { DeleteForm } from "@/app/delete-form";

let sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!, {
  ssl: "allow",
});

export default async function Home() {
  let todos = await sql`SELECT * FROM todos`;

  return (
    <main>
      <h1>Todos</h1>
      <AddForm />
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.text}
            <DeleteForm id={todo.id} todo={todo.text} />
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### Navigation Hooks - useRouter, usePathname, useSearchParams

Client-side navigation hooks for reading and manipulating the current URL in Client Components.

```typescript
// app/components/locale-switcher.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { i18n, type Locale } from "@/i18n-config";

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectedPathname = (locale: Locale) => {
    if (!pathname) return "/";
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/");
  };

  return (
    <div>
      <p>Locale switcher:</p>
      <ul>
        {i18n.locales.map((locale) => {
          return (
            <li key={locale}>
              <Link href={redirectedPathname(locale)}>{locale}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Search component with useSearchParams
// app/search/search-bar.tsx
"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      type="text"
      placeholder="Search..."
      onChange={(e) => handleSearch(e.target.value)}
      defaultValue={searchParams.get('query') || ''}
    />
  );
}

// Page that reads search params
// app/search/page.tsx
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const query = searchParams.query;
  const results = query ? await searchProducts(query) : [];

  return (
    <div>
      <h1>Search Results</h1>
      {query && <p>Showing results for: {query}</p>}
      <SearchBar />
      <ul>
        {results.map((result) => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Pages Router - getStaticProps and getStaticPaths

Pages Router data fetching methods for static site generation with dynamic routes.

```typescript
// pages/gsp/[slug].tsx
import type {
  GetStaticProps,
  GetStaticPaths,
  InferGetStaticPropsType,
} from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import LocaleSwitcher from "../../components/locale-switcher";

type GspPageProps = InferGetStaticPropsType<typeof getStaticProps>;

export default function GspPage(props: GspPageProps) {
  const router = useRouter();
  const { defaultLocale, isFallback, query } = router;

  if (isFallback) {
    return "Loading...";
  }

  return (
    <div>
      <h1>getStaticProps page</h1>
      <p>Current slug: {query.slug}</p>
      <p>Current locale: {props.locale}</p>
      <p>Default locale: {defaultLocale}</p>
      <p>Configured locales: {JSON.stringify(props.locales)}</p>

      <LocaleSwitcher />

      <Link href="/gsp">To getStaticProps page</Link>
      <br />

      <Link href="/gssp">To getServerSideProps page</Link>
      <br />

      <Link href="/">To index page</Link>
      <br />
    </div>
  );
}

type Props = {
  locale?: string;
  locales?: string[];
};

export const getStaticProps: GetStaticProps<Props> = async ({
  locale,
  locales,
}) => {
  return {
    props: {
      locale,
      locales,
    },
  };
};

export const getStaticPaths: GetStaticPaths = ({ locales = [] }) => {
  const paths = [];

  for (const locale of locales) {
    paths.push({ params: { slug: "first" }, locale });
    paths.push({ params: { slug: "second" }, locale });
  }

  return {
    paths,
    fallback: true,
  };
};

// pages/posts/[id].tsx - getServerSideProps
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';

type Post = {
  id: string;
  title: string;
  content: string;
};

export const getServerSideProps: GetServerSideProps<{ post: Post }> = async (context) => {
  const { id } = context.params!;
  const post = await getPost(id as string);

  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },
  };
};

export default function PostPage({ post }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### Image Optimization

Next.js Image component provides automatic image optimization with lazy loading, responsive images,
and modern formats.

```typescript
// app/page.tsx
import Image from "next/image";
import Link from "next/link";
import vercel from "../public/vercel.png";

const Index = () => (
  <div>
    <h2 id="internal">Internal Image</h2>
    <p>The following is an example of a reference to an internal image from the public directory.</p>

    <Image
      alt="Vercel logo"
      src={vercel}
      width={1000}
      height={1000}
      style={{
        maxWidth: "100%",
        height: "auto",
      }}
    />

    <h2 id="external">External Image</h2>
    <p>External images must be configured in next.config.js using the remotePatterns property.</p>

    <Image
      alt="Next.js logo"
      src="https://assets.vercel.com/image/upload/v1538361091/repositories/next-js/next-js-bg.png"
      width={1200}
      height={400}
      style={{
        maxWidth: "100%",
        height: "auto",
      }}
    />

    <h2 id="responsive">Responsive Image</h2>
    <Image
      alt="Responsive image"
      src="/hero.jpg"
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        objectFit: "cover",
      }}
    />
  </div>
);

export default Index;

// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.vercel.com",
        port: "",
        pathname: "/image/upload/**",
      },
    ],
    // Optional: Configure image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Optional: Configure formats
    formats: ['image/webp'],
  },
};
```

### Middleware

Middleware runs before a request is completed, allowing you to modify the response, rewrite,
redirect, or add headers.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl

  // Authentication check
  const token = request.cookies.get('token')
  if (!token && url.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Add custom header
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'my-value')

  return response
}

// Middleware with rewrite
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl

  // Rewrite root to a different page
  if (url.pathname === '/') {
    url.pathname = '/home'
    return NextResponse.rewrite(url)
  }

  // Redirect example
  if (url.pathname === '/old-path') {
    return NextResponse.redirect(new URL('/new-path', request.url))
  }

  // A/B testing
  const bucket = request.cookies.get('bucket')
  if (url.pathname === '/experiment' && bucket?.value === 'b') {
    url.pathname = '/experiment-b'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

// Internationalization middleware
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const locales = ['en', 'fr', 'de']
const defaultLocale = 'en'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // Redirect if there is no locale
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

function getLocale(request: NextRequest): string {
  // Get locale from cookie or accept-language header
  return request.cookies.get('locale')?.value || defaultLocale
}
```

### Data Fetching with Caching

Fetch API with built-in caching options for optimized data fetching in Server Components.

```typescript
// app/cases/fetch_cached/page.tsx
export default async function Page() {
  return (
    <>
      <p>This page renders two components each performing cached fetches.</p>
      <ComponentOne />
      <ComponentTwo />
    </>
  )
}

async function ComponentOne() {
  return <div>message 1: {await fetchRandomCached('a')}</div>
}

async function ComponentTwo() {
  return (
    <>
      <div>message 2: {await fetchRandomCached('b')}</div>
      <div>message 3: {await fetchRandomCached('c')}</div>
    </>
  )
}

const fetchRandomCached = async (entropy: string) => {
  const response = await fetch(
    'https://next-data-api-endpoint.vercel.app/api/random?b=' + entropy,
    { cache: 'force-cache' }
  )
  return response.text()
}

// Different caching strategies
// app/lib/data.ts

// Force cache (default for fetch in Server Components)
export async function getCachedData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'force-cache',
  })
  return res.json()
}

// No store - always fetch fresh data
export async function getDynamicData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store',
  })
  return res.json()
}

// Revalidate - cache for a specific time
export async function getRevalidatedData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // revalidate every hour
  })
  return res.json()
}

// Tag-based revalidation
export async function getTaggedData() {
  const res = await fetch('https://api.example.com/data', {
    next: { tags: ['products'] },
  })
  return res.json()
}
```

### Metadata Configuration

Define page metadata for SEO using the Metadata API in App Router.

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Next.js Blog Example`,
  description: `A statically generated blog example using Next.js.`,
  openGraph: {
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta name="theme-color" content="#000" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}

// Dynamic metadata
// app/posts/[slug]/page.tsx
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  }
}

// File-based metadata
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Hello World!
      </div>
    ),
    {
      ...size,
    }
  )
}
```

### Dynamic Import and Code Splitting

Dynamically import components to optimize bundle size and loading performance.

```typescript
// app/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const DynamicComponent1 = dynamic(() => import("./_components/hello1"));

const DynamicComponent2WithCustomLoading = dynamic(
  () => import("./_components/hello2"),
  { loading: () => <p>Loading caused by client page transition ...</p> },
);

const DynamicComponent3WithNoSSR = dynamic(
  () => import("./_components/hello3"),
  { loading: () => <p>Loading ...</p>, ssr: false },
);

const names = ["Tim", "Joe", "Bel", "Max", "Lee"];

export default function IndexPage() {
  const [showMore, setShowMore] = useState(false);
  const [results, setResults] = useState();

  return (
    <div>
      {/* Load immediately, but in a separate bundle */}
      <DynamicComponent1 />

      {/* Show a progress indicator while loading */}
      <DynamicComponent2WithCustomLoading />

      {/* Load only on the client side */}
      <DynamicComponent3WithNoSSR />

      {/* Load on demand */}
      {showMore && <DynamicComponent4 />}
      <button onClick={() => setShowMore(!showMore)}>Toggle Show More</button>

      {/* Load library on demand */}
      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Search"
          onChange={async (e) => {
            const { value } = e.currentTarget;
            // Dynamically load fuse.js
            const Fuse = (await import("fuse.js")).default;
            const fuse = new Fuse(names);
            setResults(fuse.search(value));
          }}
        />
        <pre>Results: {JSON.stringify(results, null, 2)}</pre>
      </div>
    </div>
  );
}

// Server Component with dynamic imports
// app/dashboard/page.tsx
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/chart'), {
  ssr: false,
  loading: () => <p>Loading chart...</p>,
})

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Chart />
    </div>
  )
}
```

### Next.js Configuration

Configure Next.js behavior through next.config.js including image domains, redirects, rewrites,
experimental features.

```typescript
// next.config.ts - Basic configuration
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// next.config.js - Advanced configuration with experimental features
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic options
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  trailingSlash: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/images/**",
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ]
  },

  // Rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.example.com/:path*',
      },
    ]
  },

  // Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Experimental features
  experimental: {
    // Partial Prerendering
    ppr: false,

    // Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['example.com'],
    },

    // Typed routes
    typedRoutes: false,

    // Optimize package imports
    optimizePackageImports: ['lodash', 'date-fns'],

    // MDX Rust compiler
    mdxRs: false,

    // Server minification and source maps
    serverMinification: true,
    serverSourceMaps: false,

    // Instrumentation
    instrumentationHook: false,

    // External packages for Server Components
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Webpack customization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig;
```

### Loading and Error UI

Special files for handling loading states and errors in App Router with automatic integration.

```typescript
// app/loading.tsx
import React from 'react'

export default function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  )
}

// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}

// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}

// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}

// Trigger not-found in a page
// app/posts/[id]/page.tsx
import { notFound } from 'next/navigation'

export default async function Post({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)

  if (!post) {
    notFound()
  }

  return <article>{post.content}</article>
}
```

### Link Component for Client-Side Navigation

Next.js Link component enables client-side navigation between routes with automatic prefetching.

```typescript
// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <nav>
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <Link href="/blog">Blog</Link>
        </li>
        <li>
          {/* Dynamic route */}
          <Link href="/posts/123">Post 123</Link>
        </li>
        <li>
          {/* External link */}
          <Link href="https://example.com" target="_blank" rel="noopener noreferrer">
            External Link
          </Link>
        </li>
        <li>
          {/* Link with query params */}
          <Link href={{ pathname: '/search', query: { q: 'next.js' } }}>
            Search Next.js
          </Link>
        </li>
        <li>
          {/* Disable prefetch */}
          <Link href="/heavy-page" prefetch={false}>
            Heavy Page (no prefetch)
          </Link>
        </li>
      </ul>
    </nav>
  );
}

// Pages Router example with dynamic routing
// pages/index.tsx
import type { User } from "../interfaces";
import useSwr from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Index() {
  const { data, error, isLoading } = useSwr<User[]>("/api/users", fetcher);

  if (error) return <div>Failed to load users</div>;
  if (isLoading) return <div>Loading...</div>;
  if (!data) return null;

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>
          <Link href={`/user/${user.id}`}>
            {user.name ?? `User ${user.id}`}
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

### Pages Router - Custom App Component

The \_app.tsx file allows you to override the default App component to control page initialization
and add global layouts.

```typescript
// pages/_app.tsx
import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="preload"
          href="/fonts/Inter-roman.latin.var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

### Redirects and Navigation

Programmatic navigation and redirects in App Router.

```typescript
// Server Component redirect
// app/profile/page.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return <div>Profile: {session.user.name}</div>
}

// Client Component navigation
// app/components/login-button.tsx
'use client'

import { useRouter } from 'next/navigation'

export function LoginButton() {
  const router = useRouter()

  return (
    <button onClick={() => router.push('/login')}>
      Login
    </button>
  )
}

// Navigation with search params
// app/components/pagination.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function Pagination({ totalPages }: { totalPages: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div>
      <button
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  )
}

// Permanent redirect
// app/old-page/page.tsx
import { permanentRedirect } from 'next/navigation'

export default function OldPage() {
  permanentRedirect('/new-page')
}
```

## Summary

Next.js 16 has evolved into a comprehensive framework that addresses the full spectrum of web
development needs, from simple static sites to complex, data-driven applications. The framework's
dual router support (App Router and Pages Router) provides flexibility for both greenfield projects
and gradual migrations, while the App Router's innovative features like React Server Components,
Server Actions, and streaming represent the cutting edge of React development patterns. Version
16.1.0 introduces significant enhancements including the stable Form component for progressive
enhancement and improved user experience, cacheLife() API with predefined profiles (seconds,
minutes, hours, days, weeks, max) for declarative cache control, cacheTag() for granular cache
invalidation with tag-based strategies, new revalidation methods updateTag() and refresh() for more
flexible cache management, and enhanced React 19 compatibility with improved Server Actions and form
handling. The framework provides synchronous request APIs (cookies(), headers(), draftMode()) that
work seamlessly in Server Components and Route Handlers, enabling developers to access request
information without additional complexity.

The framework excels at solving common web development challenges through conventions and built-in
optimizations. Image optimization with the next/image component, automatic code splitting with
dynamic imports, intelligent prefetching with the Link component, and flexible caching strategies
through the fetch API and new cacheLife() function are all handled by Next.js out of the box. The
new Form component from next/form simplifies form handling with progressive enhancement, automatic
loading states, and seamless Server Action integration. Server Actions eliminate the need for
separate API endpoints for many use cases, reducing boilerplate and simplifying full-stack
development through direct server function calls from Client Components using useFormState and
useFormStatus hooks. The Middleware system provides powerful request-time capabilities for
authentication, localization, A/B testing, and routing logic at the edge, while the rich ecosystem
of configuration options allows fine-tuning for specific deployment scenarios. With Next.js 16, the
framework provides stable support for advanced caching strategies with cacheLife() profiles and
custom configurations, improved developer experience with better error messages and TypeScript
integration, enhanced performance through optimized bundling and tree-shaking, flexible revalidation
with updateTag() for targeted cache updates and refresh() for page-level data refreshing, and
comprehensive support for modern React patterns including React Server Components and concurrent
features. Whether building marketing sites, e-commerce platforms with the Form component, dashboards
with real-time data using refresh(), or content-heavy applications with CMS integration through
draft mode and cacheTag(), Next.js 16 provides the APIs and patterns to build performant, scalable
applications that deliver excellent user experiences while maintaining developer productivity and
code quality.
