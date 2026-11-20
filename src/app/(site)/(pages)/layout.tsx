import React from 'react';
import SiteFooter from '@/components/shell/SiteFooter';

type Props = LayoutProps<'/'>;

const PagesLayout = ({ children }: Props) => {
  return (
    <>
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter variant="inline" />
    </>
  );
};

export default PagesLayout;
