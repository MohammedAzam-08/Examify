import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
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
import { register, clearError } from '../slices/authSlice';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
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
    if (!name || !email || !password) {
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
      await dispatch(register({ name, email, password, role })).unwrap();
      toast({
        title: 'Success',
        description: 'Registration successful',
        status: 'success',
        duration: 3000,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Registration failed',
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
          <Heading>Register</Heading>

          <FormControl id="name" isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </FormControl>

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

          <FormControl id="role" isRequired>
            <FormLabel>Role</FormLabel>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </Select>
          </FormControl>

          <Button
            colorScheme="blue"
            width="full"
            type="submit"
            isLoading={loading || isSubmitting}
            loadingText="Registering..."
          >
            Register
          </Button>

          <Text>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'blue' }}>
              Login here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register;