import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cx } from '@/shared/lib/cx';
import { CloseIcon, DashboardIcon, MenuIcon, PlusIcon, UsersIcon } from '@/shared/ui/icons';
import { LoadingState } from '@/shared/ui/States';
import './layout.css';

const NAV = [
  { to: '/', label: 'Обзор', icon: DashboardIcon },
  { to: '/registry', label: 'Картотека граждан', icon: UsersIcon },
  { to: '/registry/new', label: 'Новая карточка', icon: PlusIcon },
] as const;

function isActive(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/';
  if (to === '/registry') return pathname.startsWith('/registry') && pathname !== '/registry/new';
  return pathname === to;
}

export function AppLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>

      <header className="topbar">
        <button
          type="button"
          className="topbar__menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <span className="topbar__title">Картотека граждан</span>
      </header>

      <aside id="sidebar" className={cx('sidebar', menuOpen && 'sidebar--open')}>
        <div className="brand">
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#dcefe8" />
            <path d="M9 21c0-6 4-10 14-10 0 8-4 12-10 12-1.5 0-3-.5-4-2z" fill="#0b6b57" />
          </svg>
          <div>
            <p className="brand__name">Картотека</p>
            <p className="brand__sub">ИС внутренней деятельности</p>
          </div>
        </div>

        <nav aria-label="Основное меню">
          <ul className="nav">
            {NAV.map((item) => {
              const active = isActive(item.to, pathname);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cx('nav__link', active && 'nav__link--active')}
                    aria-current={active ? 'page' : undefined}
                  >
                    <item.icon />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar__user">
          <span className="sidebar__avatar" aria-hidden="true">АК</span>
          <div>
            <p className="brand__name">Анна Кузнецова</p>
            <p className="brand__sub">Оператор картотеки</p>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <main id="main" className="main">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
