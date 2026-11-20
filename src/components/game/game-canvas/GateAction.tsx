'use client';

import React from 'react';
import Link from 'next/link';
import { PRO_PATH } from '@/lib/pro';
import { PRIMARY_BUTTON, SECONDARY_BUTTON, TEXT_LINK } from '@/styles/classes';
import type { CanvasGateView } from '@/types/canvas';

type Props = {
  gate: CanvasGateView;
  onGateAction: () => void;
  onGateSecondaryAction: () => void;
};

const GateAction = ({ gate, onGateAction, onGateSecondaryAction }: Props) => {
  if (gate.secondaryActionLabel || gate.seePro) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          className={`w-full ${PRIMARY_BUTTON}`}
          onClick={() => onGateAction()}
        >
          {gate.actionLabel}
        </button>
        {gate.secondaryActionLabel ? (
          <button
            type="button"
            className={`w-full ${SECONDARY_BUTTON}`}
            onClick={onGateSecondaryAction}
          >
            {gate.secondaryActionLabel}
          </button>
        ) : null}
        {gate.seePro ? (
          <Link href={PRO_PATH} className={`text-14 ${TEXT_LINK}`}>
            See Pro
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={PRIMARY_BUTTON}
      onClick={() => onGateAction()}
    >
      {gate.actionLabel}
    </button>
  );
};

export default GateAction;
