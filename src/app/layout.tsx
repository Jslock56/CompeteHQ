import { Inter } from 'next/font/google';
import { Providers } from "./providers";
import '../styles/globals.css'; // Correct path to your CSS file

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CompeteHQ - Baseball Coach App',
  description: 'Manage your baseball team with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}

// We need to extract the AppLayout to a separate client component
import { AppLayout } from '../components/layout/app-layout';