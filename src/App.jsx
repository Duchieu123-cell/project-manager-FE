import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './layouts/RootLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProjectList from './pages/ProjectList.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import NotFound from './pages/NotFound.jsx'
// import AuthProvider from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Unauthorized from './pages/Unauthorized.jsx'
import { PERMISSIONS } from './data/permissionData.js'
import Home from './pages/Home.jsx'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error.response?.status === 404) {
          return false; // Don't retry on 404 errors
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 1, // 1 minute
    }
  }
})

const router = createBrowserRouter([
    {
      path: "login",
      element: <Login />,
    },
    {
      path: "register",
      element: <Register />,
    },
    {
      path: "unauthorized",
      element: <Unauthorized />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <RootLayout />,
          children: [
            {
              path: "/",
              element: <Home />,
            },
            {
              element: (
                <ProtectedRoute 
                  permissions={[PERMISSIONS.PROJECT_READ, PERMISSIONS.TASK_READ]} 
                  requiredAll={true} 
                />
              ),
              children: [
                {
                  path: "dashboard",
                  element: <Dashboard />,
                }
              ]
            },
            {
              element: (
                <ProtectedRoute 
                  permissions={[PERMISSIONS.PROJECT_READ]} 
                  requiredAll={true} 
                />
              ),
              children: [
                {
                  path: "projects",
                  element: <ProjectList />,
                }
              ]
            },
            {
              element: (
                <ProtectedRoute 
                  permissions={[PERMISSIONS.TASK_READ]} 
                  requiredAll={true} 
                />
              ),
              children: [
                {
                  path: "projects/:projectId",
                  element: <ProjectDetail />,
                }
              ]
            },
          ],
        }
      ]
    },
    {
      path: "*",
      element: <NotFound />,
    }
]);

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      {/* <AuthProvider> */}
        <RouterProvider router={router} />
      {/* </AuthProvider> */}
    </QueryClientProvider>

  )
}

export default App
