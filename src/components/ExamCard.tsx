import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import React from 'react';

const ExamCard = ({ exam }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);
  const isActive = now >= startTime && now <= endTime;
  const isUpcoming = now < startTime;

  const getStatusBadge = () => {
    if (user.role === 'student') {
      if (exam.submitted) return <Badge colorScheme="blue">Submitted</Badge>;
      if (isActive) return <Badge colorScheme="green">Active</Badge>;
      if (isUpcoming) return <Badge colorScheme="yellow">Upcoming</Badge>;
      return <Badge colorScheme="red">Expired</Badge>;
    } else {
      return <Badge colorScheme="purple">{exam.submissions || 0} Submissions</Badge>;
    }
  };

  return (
    <Box
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="md"
      bg="white"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
    >
      <VStack align="stretch" spacing={3}>
        <Heading size="md">{exam.title}</Heading>
        <Text color="gray.600">{exam.subject}</Text>
        <HStack>
          {getStatusBadge()}
        </HStack>
        <Text fontSize="sm">
          Start: {format(startTime, 'PPp')}
        </Text>
        <Text fontSize="sm">
          Duration: {exam.duration} minutes
        </Text>
        {user.role === 'student' ? (
          <Button
            colorScheme="blue"
            onClick={() => navigate(`/exam/${exam._id}`)}
            isDisabled={!isActive || exam.submitted}
          >
            {exam.submitted ? 'Submitted' : isActive ? 'Start Exam' : 'View Details'}
          </Button>
        ) : (
          <Button
            colorScheme="blue"
            onClick={() => navigate(`/exam/${exam._id}`)}
          >
            View Submissions
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ExamCard;