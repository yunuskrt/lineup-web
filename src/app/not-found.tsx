import type { Metadata } from 'next';
import { NOT_FOUND_TITLE, NotFoundView } from '@/components/shell/NotFoundView';
import { SiteNav } from '@/components/shell/SiteNav';

export const metadata: Metadata = {
  title: NOT_FOUND_TITLE,
};

// Unknown URLs skip the site layout, so add its nav
export default function NotFound() {
  return (
    <>
      <SiteNav />
      <NotFoundView />
    </>
  );
}
