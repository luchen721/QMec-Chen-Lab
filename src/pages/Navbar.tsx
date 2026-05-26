import { Link, NavLink } from 'react-router-dom';
import { assetPath } from '../utils/assetPath';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Research', path: '/research' },
  { label: 'People', path: '/people' },
  { label: 'Lab', path: '/lab' },
  { label: 'Publications', path: '/publications' },
  { label: 'News', path: '/news' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Join Us / Contact', path: '/join-us' },
];

export function Navbar() {
  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">
          <img src={assetPath('/images/research/quantum-materials-bulk-overview.png')} alt="" />
        </span>
        <span>
          <strong>QMec Chen Lab</strong>
          <small>Quantum materials under extreme conditions</small>
        </span>
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

