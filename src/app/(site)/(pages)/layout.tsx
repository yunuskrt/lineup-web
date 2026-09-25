import { SiteFooter } from '@/components/shell/SiteFooter';

export default function PagesLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter variant="inline" />
    </>
  );
}
