import { useTheme } from '@/hooks/useTheme';
import { router } from '@/router';
import { useAuthStore } from '@/stores/auth.store';
import { ToastContainer } from '@/ui/components/Feedback';
import { GlobalStyle } from '@/ui/theme/GlobalStyle';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

export const App = () => {
  const { theme } = useTheme();
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <RouterProvider router={router} />
      <ToastContainer />
    </ThemeProvider>
  );
};

export default App;
