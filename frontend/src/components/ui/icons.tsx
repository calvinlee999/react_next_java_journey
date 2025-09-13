import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const createIcon = (pathData: string) => ({ className = 'w-4 h-4', size }: IconProps) => (
  <svg
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={pathData} />
  </svg>
);

export const Activity = createIcon("M22 12h-2.48a2 2 0 0 0-1.93 2.52l-1.35 4.87a1 1 0 0 1-1.93-.01L12.5 13a2 2 0 0 0-1.93-2.52H8");
export const MessageSquare = createIcon("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z");
export const Database = createIcon("M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3S16.418 3 12 3 4 4.343 4 6zM4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6");
export const Play = createIcon("M5 3l14 9-14 9V3z");
export const Pause = createIcon("M6 4h4v16H6zM14 4h4v16h-4z");
export const Settings = createIcon("M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z");
export const Zap = createIcon("M13 2L3 14h9l-1 8 10-12h-9l1-8z");
export const Shield = createIcon("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z");
export const CheckCircle = createIcon("M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3");
export const AlertTriangle = createIcon("M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z");
export const TrendingUp = createIcon("M23 6l-9.5 9.5-5-5L1 18");
export const BarChart3 = createIcon("M3 3v18h18M7 16l4-4 4 4 4-8");
export const GitBranch = createIcon("M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9");
export const RefreshCw = createIcon("M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8");
export const Webhook = createIcon("M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2.01C3.47 13.5 4.93 13 6.34 13H9m9 3.98h-5.99c-1.1 0-1.95-.94-2.48-1.9A4 4 0 0 1 18 17c-.01.7-.2 1.4-.57 2.01C16.53 20.5 15.07 21 13.66 21H11");
export const Clock = createIcon("M12 2v10l4 4");
export const XCircle = createIcon("M18 6L6 18M6 6l12 12");