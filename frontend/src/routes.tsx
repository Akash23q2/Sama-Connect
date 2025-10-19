import { createBrowserRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Auth from '@/pages/Auth';
import Room from '@/pages/NewRoom';
import NotFound from '@/pages/NotFound';
import Landing from '@/pages/Landing';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
    id: 'root',
  },
  {
    path: 'auth',
    element: <Auth />,
    id: 'auth',
  },
  {
    path: 'dashboard',
    element: <Dashboard />,
    id: 'dashboard',
  },
  {
    path: 'room/:roomId',
    element: <Room />,
    id: 'room',
  },
  {
    path: '*',
    element: <NotFound />,
    id: '404',
  },
]);