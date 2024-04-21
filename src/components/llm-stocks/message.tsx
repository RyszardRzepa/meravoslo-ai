'use client';

import { IconAI, IconUser } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative sm:flex gap-3 items-start">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border border-peachDark">
        <IconUser />
      </div>
      <div className="mt-2 sm:mt-0 flex-1 space-y-2 overflow-hidden rounded-md p-4 bg-peach border border-peachDark">
        {children}
      </div>
    </div>
  );
}

export function BotMessage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('group relative sm:flex gap-3 items-start', className)}>
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-peach text-primary-foreground">
        <IconAI />
      </div>
      <div className="mt-2 sm:mt-0 flex-1 space-y-2 overflow-hidden rounded-md p-4 bg-peach border border-peachDark">
        {children}
      </div>
    </div>
  );
}

export function BotCard({
                          children,
                          showAvatar = true,
}: {
  children: React.ReactNode;
  showAvatar?: boolean;
}) {
  return (
    <div className="group relative sm:flex gap-3 items-start">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border border-peachDark' +
          ' bg-peach text-primary-foreground',
          !showAvatar && 'invisible',
        )}
      >
        <IconAI />
      </div>
      <div className="mt-2 sm:mt-0 flex-1 space-y-2 overflow-hidden rounded-md p-4 bg-peach border border-peachDark">{children}</div>
    </div>
  );
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'group relative sm:flex gap-3 items-start'
      }
    >
      <div className="mt-2 sm:mt-0 flex-1 space-y-2 overflow-hidden rounded-md p-4 bg-peach border border-peachDark">{children}</div>
    </div>
  );
}
