import React, { type ReactNode } from 'react';
import { BOARD_SECTION, TYPE_TITLE } from '@/styles/classes';

type Props = { title: string; children?: ReactNode };

const Header = ({ title, children }: Props) => {
  return (
    <header className={BOARD_SECTION}>
      <h1 className={TYPE_TITLE}>{title}</h1>
      {children}
    </header>
  );
};

export default Header;
