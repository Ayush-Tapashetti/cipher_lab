import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import NotFound from './routes/NotFound';
import RouteError from './routes/RouteError';
import Workspace from './routes/Workspace';

// Secondary screens load on demand to keep the first load small (bundle budget in experience.json).
const MathLab = lazy(() => import('./routes/MathLab'));
const Verify = lazy(() => import('./routes/Verify'));

// History routing only: real URLs such as /math-lab, never #/math-lab.
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Workspace /> },
      { path: 'math-lab', element: <MathLab /> },
      { path: 'verify', element: <Verify /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
