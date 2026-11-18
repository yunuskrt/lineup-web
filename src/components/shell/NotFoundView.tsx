import React from 'react';
import Link from 'next/link';
import SiteFooter from '@/components/shell/SiteFooter';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  BOARD,
  BOARD_SECTION,
  PRIMARY_BUTTON_LARGE,
  SECONDARY_BUTTON_LARGE,
  SITE_CONTAINER,
  TYPE_NUMBER,
  TYPE_TITLE,
} from '@/styles/classes';

export const NOT_FOUND_TITLE = 'Not found';

type Props = {};

// The 404 body and footer; the nav comes from the caller
const NotFoundView = ({}: Props) => {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <div className={`${SITE_CONTAINER} py-12`}>
          <div className={BOARD}>
            <div className={BOARD_SECTION}>
              <div className="flex flex-wrap items-center gap-4">
                <p
                  className={cn(TYPE_NUMBER, 'text-64 leading-none sm:text-72')}
                >
                  404
                </p>
                <Badge variant="sticker" tone="butter">
                  Off the pitch
                </Badge>
              </div>
              <h1 className={TYPE_TITLE}>Can not find the page</h1>
            </div>
            <div className={BOARD_SECTION}>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/play" className={PRIMARY_BUTTON_LARGE}>
                  Play
                </Link>
                <Link href="/" className={SECONDARY_BUTTON_LARGE}>
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter variant="inline" />
    </>
  );
};

export default NotFoundView;
