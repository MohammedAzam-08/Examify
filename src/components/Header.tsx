import {
  Box,
  Flex,
  Button,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const bg = useColorModeValue('white', 'gray.800');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box bg={bg} px={4} boxShadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Text fontSize="xl" fontWeight="bold">
          Exam Platform
        </Text>
        <Flex alignItems="center">
          <Text mr={4}>
            {user.name} ({user.role})
          </Text>
          <Button onClick={handleLogout} colorScheme="blue" variant="outline">
            Logout
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;