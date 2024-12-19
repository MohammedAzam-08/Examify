import { useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Button,
  useToast,
  Flex,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchExams } from '../slices/examSlice';
import ExamCard from '../components/ExamCard';
import Header from '../components/Header';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { exams, loading, error } = useSelector((state) => state.exam);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);

  const handleCreateExam = () => {
    navigate('/create-exam');
  };

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text color="red.500">{error}</Text>;

  return (
    <Box>
      <Header />
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading>
            {user.role === 'faculty' ? 'My Created Exams' : 'My Upcoming Exams'}
          </Heading>
          {user.role === 'faculty' && (
            <Button
              colorScheme="blue"
              onClick={handleCreateExam}
              size="lg"
            >
              Create New Exam
            </Button>
          )}
        </Flex>
        {exams.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text fontSize="xl" color="gray.600">
              {user.role === 'faculty' 
                ? "You haven't created any exams yet."
                : "You don't have any upcoming exams."}
            </Text>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {exams.map((exam) => (
              <ExamCard key={exam._id} exam={exam} />
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;