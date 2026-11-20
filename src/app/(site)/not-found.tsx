import React from 'react';
import type { Metadata } from 'next';
import NotFoundView, { NOT_FOUND_TITLE } from '@/components/shell/NotFoundView';

export const metadata: Metadata = {
  title: NOT_FOUND_TITLE,
};

type Props = {};

// notFound() in a site page: the site layout has the nav
const SiteNotFound = ({}: Props) => {
  return <NotFoundView />;
};

export default SiteNotFound;
