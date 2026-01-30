import { AuthProvider } from '@/contexts/AuthContext';
import { AppRouter } from '@/routes';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
