import React from 'react';
import SiteNav from '@/components/shell/SiteNav';

type Props = LayoutProps<'/'>;

const SiteLayout = ({ children }: Props) => {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
};

export default SiteLayout;
