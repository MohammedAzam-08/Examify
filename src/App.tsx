import { ChakraProvider } from '@chakra-ui/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamScreen from './pages/ExamScreen';
import CreateExam from './pages/CreateExam';
import theme from './theme';
import React from 'react';

const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/exam/:id',
    element: (
      <PrivateRoute>
        <ExamScreen />
      </PrivateRoute>
    ),
  },
  {
    path: '/create-exam',
    element: (
      <PrivateRoute>
        <CreateExam />
      </PrivateRoute>
    ),
  },
];

const router = createBrowserRouter(routes);

function App() {
  return (
    <ChakraProvider theme={theme}>
      <RouterProvider router={router} />
    </ChakraProvider>
  );
}

export default App;