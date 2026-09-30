import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'Receiving Manager | AI Visual Receiving Inspection System',
  description: 'Evidence-backed visual receiving inspection application with deterministic decision logic.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const removeExtensionAttrs = function(node) {
                    if (node && node.removeAttribute) {
                      node.removeAttribute('bis_skin_checked');
                      node.removeAttribute('cz-shortcut-listen');
                    }
                  };
                  const observer = new MutationObserver(function(mutations) {
                    for (let i = 0; i < mutations.length; i++) {
                      const m = mutations[i];
                      if (m.type === 'attributes' && (m.attributeName === 'bis_skin_checked' || m.attributeName === 'cz-shortcut-listen')) {
                        removeExtensionAttrs(m.target);
                      }
                    }
                  });
                  if (document.documentElement) {
                    observer.observe(document.documentElement, { attributes: true, subtree: true });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6" suppressHydrationWarning>
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-4" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500" suppressHydrationWarning>
            Receiving Manager &copy; {new Date().getFullYear()} &bull; AI Visual Receiving Inspection &bull; Zero-Budget Architecture &bull; Deterministic Business Logic
          </div>
        </footer>
      </body>
    </html>
  );
}
