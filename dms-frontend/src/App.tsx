import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeModeProvider } from '@/theme/ThemeModeContext';
import AppRoutes from '@/routes/AppRoutes';

export default function App() {
  return (
    <ThemeModeProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar />
      </BrowserRouter>
    </ThemeModeProvider>
  );
}
