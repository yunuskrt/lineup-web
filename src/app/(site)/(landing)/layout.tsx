import React from 'react';
import SiteFooter from '@/components/shell/SiteFooter';

type Props = LayoutProps<'/'>;

const LandingLayout = ({ children }: Props) => {
  return (
    <>
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter variant="statement" />
    </>
  );
};

export default LandingLayout;
