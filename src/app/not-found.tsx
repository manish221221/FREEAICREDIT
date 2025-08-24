'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center gap-4">
      <div>
        <h1 className="font-headline text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mt-2">The page you are looking for does not exist.</p>
      </div>
      <Button asChild>
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  );
}

