'use client';

import React, { useState } from 'react';
import { cooldownAnnouncement } from '@/lib/system-states';

type Props = { until: number };

// Keyed per lockout, so it is read once
const CooldownAnnouncement = ({ until }: Props) => {
  const [message] = useState(() => cooldownAnnouncement(until - Date.now()));
  return message;
};

export default CooldownAnnouncement;
