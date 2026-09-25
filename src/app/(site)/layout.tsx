import { SiteNav } from '@/components/shell/SiteNav';

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
