import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRouter from './routes/AppRouter';

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return <AppRouter />;
}