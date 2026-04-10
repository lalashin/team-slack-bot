import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Team Slack Bot Dashboard',
  description: 'Slack 봇 상태·통계·로그 모니터링',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
