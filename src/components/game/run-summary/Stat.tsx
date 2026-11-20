import React from 'react';
import { TYPE_NUMBER } from '@/styles/classes';

type Props = {
  label: string;
  value: string;
};

const Stat = ({ label, value }: Props) => {
  return (
    <div className="flex flex-col justify-center gap-0.5 px-1 first:border-r-2 first:border-line last:pl-4">
      <dt className="text-12 leading-4 font-medium text-fg-muted uppercase">
        {label}
      </dt>
      <dd className={`text-28 leading-none ${TYPE_NUMBER}`}>{value}</dd>
    </div>
  );
};

export default Stat;
