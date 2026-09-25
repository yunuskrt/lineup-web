import { SiteFooter } from '@/components/shell/SiteFooter';

export default function LandingLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter variant="statement" />
    </>
  );
}
