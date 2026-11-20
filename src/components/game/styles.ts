import { RAIL_SECTION } from '@/styles/classes';

// Fixed heights keep the skeleton in the same boxes
export const OUTCOME_BOX = `relative flex h-24 items-center justify-between gap-4 border-b-2 border-line -mt-3 sm:-mt-4 ${RAIL_SECTION}`;

// The 352px rail can't take TYPE_TITLE's 40px
export const OUTCOME_TITLE =
  'font-display text-24 leading-tight font-extrabold font-stretch-semi-expanded outline-none min-[360px]:text-30';
