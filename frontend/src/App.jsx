import { AuthProvider } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

const App = () => (
  <AuthProvider>
    <Layout>
      <AppRoutes />
    </Layout>
  </AuthProvider>
);

export default App;
