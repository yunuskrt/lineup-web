import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { seasonLabel } from '@/lib/filters';

type Props = {
  label: string;
  value: number;
  seasons: number[];
  onChange: (season: number) => void;
};

const SeasonSelect = ({ label, value, seasons, onChange }: Props) => {
  const items = seasons.map((season) => ({
    value: season,
    label: seasonLabel(season),
  }));

  return (
    <Select
      items={items}
      value={value}
      // Ignore Base UI's own clears; picks only
      onValueChange={(next, details) => {
        if (details.reason === 'none' || next === null) return;
        if (seasons.includes(next)) onChange(next);
      }}
    >
      <div className="flex items-center gap-3">
        <SelectLabel>{label}</SelectLabel>
        <SelectTrigger className="min-w-30">
          <SelectValue />
        </SelectTrigger>
      </div>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SeasonSelect;
