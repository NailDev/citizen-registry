import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { CitizenCardRoute } from '@/features/registry/CitizenCard';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';

// Тяжёлые страницы (графики, виртуализация, форма) грузятся отдельными чанками.
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const RegistryPage = lazy(() =>
  import('@/features/registry/RegistryPage').then((m) => ({ default: m.RegistryPage })),
);
const WizardPage = lazy(() =>
  import('@/features/wizard/WizardPage').then((m) => ({ default: m.WizardPage })),
);

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'registry', element: <RegistryPage />, children: [{ path: ':id', element: <CitizenCardRoute /> }] },
        { path: 'registry/new', element: <WizardPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  // На GitHub Pages сайт живёт не в корне домена, а в /citizen-registry/ —
  // basename нужно совпадает со значением base в vite.config.ts.
  { basename: import.meta.env.BASE_URL },
);
