import Header from './Header';
import Footer from './Footer';

/** Page frame: header (with the current nav item marked), main content, footer. */
export default function Shell({ current, children }: { current?: string; children: React.ReactNode }) {
  return (
    <>
      <Header current={current} />
      <main id="top">{children}</main>
      <Footer />
    </>
  );
}
