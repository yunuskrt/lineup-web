import type { Metadata } from 'next';
import { NOT_FOUND_TITLE, NotFoundView } from '@/components/shell/NotFoundView';

export const metadata: Metadata = {
  title: NOT_FOUND_TITLE,
};

// notFound() in a site page: the site layout has the nav
export default function SiteNotFound() {
  return <NotFoundView />;
}
