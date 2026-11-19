import React from 'react';
import ProfilePlan from '@/components/profile/ProfilePlan';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { handleInitial } from '@/lib/profile';
import { cn } from '@/lib/utils';
import { TYPE_TITLE } from '@/styles/classes';
import type { User } from '@/types/user';

type Props = { user: User };

const ProfileHeader = ({ user }: Props) => {
  return (
    <header className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
      {/* The h1 names the handle; the letter is decoration */}
      <Avatar size="lg" aria-hidden="true" className="bg-block-mint">
        <AvatarFallback className="font-display text-20 font-extrabold">
          {handleInitial(user.handle)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
        <h1
          className={cn(
            TYPE_TITLE,
            'min-w-0 text-24 leading-tight break-words sm:text-30',
          )}
        >
          {user.handle}
        </h1>
        {user.isGuest ? (
          <Badge variant="sticker" tone="butter">
            Guest
          </Badge>
        ) : null}
        <ProfilePlan tier={user.tier} />
      </div>
    </header>
  );
};

export default ProfileHeader;
