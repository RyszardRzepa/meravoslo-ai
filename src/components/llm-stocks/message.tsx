'use client';

import { IconAI, IconUser } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative md:flex items-start">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-background">
        <IconUser />
      </div>
      <div className="pt-2 md:pt-0 md:ml-4 flex-1 space-y-2 overflow-hidden px-1">
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
    <div className={cn('group relative md:flex items-start', className)}>
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-primary text-primary-foreground">
        <IconAI />
      </div>
      <div className="pt-2 md:pt-0 md:ml-4 flex-1 space-y-2 overflow-hidden px-1">
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
    <div className="group relative md:flex items-start">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-primary text-primary-foreground',
          !showAvatar && 'invisible',
        )}
      >
        <IconAI />
      </div>
      <div className="pt-2 md:pt-0 md:ml-4 flex-1 space-y-2 overflow-hidden px-1">{children}</div>
    </div>
  );
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'mt-2 flex items-center justify-center gap-2 text-xs text-gray-500'
      }
    >
      <div className={'max-w-[600px] flex-initial px-2 py-2'}>{children}</div>
    </div>
  );
}
