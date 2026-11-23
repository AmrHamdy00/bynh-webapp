import Icons from '@/components/Icons';
import Behaviors from '@/components/Behaviors';
import Tracker from '@/components/Tracker';
import '../globals.css';

/** Public site chrome: icon sprite, page behaviours (menu, FAQ, motion) and first-party analytics. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Icons />
      {children}
      <Behaviors />
      <Tracker />
    </>
  );
}
