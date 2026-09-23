import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { CitizenCardRoute } from '@/features/registry/CitizenCard';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';


const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const RegistryPage = lazy(() =>
  import('@/features/registry/RegistryPage').then((m) => ({ default: m.RegistryPage })),
);
const WizardPage = lazy(() =>
  import('@/features/wizard/WizardPage').then((m) => ({ default: m.WizardPage })),
);

export const router = createBrowserRouter([
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
]);
