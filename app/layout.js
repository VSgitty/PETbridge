import './globals.css';

export const metadata = {
  title: 'PetBridge – Tierich gut vermittelt',
  description: 'Über 400 Hunde aus 22 Tierheimen in der Region Rhein-Main warten auf ihr neues Zuhause. Adoptiere jetzt oder übernimm eine Patenschaft.',
  keywords: 'Hunde adoptieren, Tierheim, Babenhausen, Gelnhausen, Hanau, Darmstadt, Patenschaft, Tiervermittlung',
  openGraph: {
    title: 'PetBridge – Tierich gut vermittelt',
    description: 'Alle Tierheim-Hunde der Region auf einen Blick.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
