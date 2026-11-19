import React from 'react';
import CoinFlip from '@/components/duel/lobby-panel/CoinFlip';
import Filters from '@/components/duel/lobby-panel/Filters';
import NoOpponent from '@/components/duel/lobby-panel/NoOpponent';
import Paired from '@/components/duel/lobby-panel/Paired';
import RoomExpired from '@/components/duel/lobby-panel/RoomExpired';
import RoomWaiting from '@/components/duel/lobby-panel/RoomWaiting';
import Searching from '@/components/duel/lobby-panel/Searching';
import type { GateSize } from '@/components/game/CanvasGate';
import type { DuelPlayer } from '@/types/duel';
import type {
  DuelLobbyStep,
  DuelLobbyView,
  LobbyAction,
} from '@/types/duel-lobby';

export const LOBBY_GATE_SIZE: Record<DuelLobbyStep, GateSize> = {
  searching: 'narrow',
  roomWaiting: 'wide',
  roomExpired: 'narrow',
  joining: 'narrow',
  paired: 'wide',
  filters: 'wide',
  coinFlip: 'wide',
  noOpponent: 'narrow',
};

type Props = {
  lobby: DuelLobbyView;
  you: DuelPlayer;
  opponent: DuelPlayer | null;
  onAction: (action: LobbyAction) => void;
};

const LobbyPanel = ({ lobby, you, opponent, onAction }: Props) => {
  switch (lobby.step) {
    case 'searching':
    case 'joining':
      return <Searching onAction={onAction} />;
    case 'roomWaiting':
      return <RoomWaiting lobby={lobby} onAction={onAction} />;
    case 'roomExpired':
      return <RoomExpired onAction={onAction} />;
    case 'paired':
      return <Paired you={you} opponent={lobby.opponent} />;
    case 'filters':
      return <Filters lobby={lobby} opponent={opponent} onAction={onAction} />;
    case 'coinFlip':
      return <CoinFlip lobby={lobby} />;
    case 'noOpponent':
      return <NoOpponent onAction={onAction} />;
  }
};

export default LobbyPanel;
