import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  FormErrorMessage,
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { login, clearError } from '../slices/authSlice';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user, error, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
    return () => {
      dispatch(clearError());
    };
  }, [user, navigate, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(login({ email, password })).unwrap();
      toast({
        title: 'Success',
        description: 'Login successful',
        status: 'success',
        duration: 3000,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Login failed',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <VStack spacing={4} as="form" onSubmit={handleSubmit}>
          <Heading>Login</Heading>
          
          <FormControl id="email" isRequired isInvalid={!!error}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>

          <FormControl id="password" isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </FormControl>

          <Button
            colorScheme="blue"
            width="full"
            type="submit"
            isLoading={loading || isSubmitting}
            loadingText="Signing in..."
          >
            Sign In
          </Button>

          <Text>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'blue' }}>
              Register here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;