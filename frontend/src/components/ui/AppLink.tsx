import { NavLink, type NavLinkProps } from 'react-router-dom';
import { cx } from '../../lib/cx';

interface AppLinkProps extends Omit<NavLinkProps, 'className' | 'style'> {
  readonly className?: string;
  /** Extra classes applied while the link points at the current page (also sets aria-current="page"). */
  readonly activeClassName?: string;
}

/**
 * The only way to navigate between pages. It always renders a real <a href>, so links work with the keyboard,
 * middle-click and "open in new tab". Buttons are for actions, never for navigation.
 */
export function AppLink({ className, activeClassName, ...props }: AppLinkProps) {
  return <NavLink {...props} className={({ isActive }) => cx(className, isActive && activeClassName)} />;
}
