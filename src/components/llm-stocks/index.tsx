'use client';

import dynamic from 'next/dynamic';
import { EventsSkeleton } from './events-skeleton';

export { spinner } from './spinner';
export { BotCard, BotMessage, SystemMessage } from './message';


const Events = dynamic(() => import('./event').then(mod => mod.Events), {
  ssr: false,
  loading: () => <EventsSkeleton />,
});

export { Events };
