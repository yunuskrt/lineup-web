import React from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';
import StateNotice from '@/components/shell/StateNotice';
import { PRIMARY_BUTTON } from '@/styles/classes';

type Props = {};

const EmptyHistory = ({}: Props) => {
  return (
    <StateNotice
      tone="empty"
      icon={History}
      title="No games yet"
      titleLevel={3}
      message="Your solo runs and duels will be listed here."
    >
      <Link href="/play" className={PRIMARY_BUTTON}>
        Play
      </Link>
    </StateNotice>
  );
};

export default EmptyHistory;
