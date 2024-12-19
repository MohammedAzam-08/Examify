import React from 'react';
import {
  HStack,
  Button,
  Box,
  Text,
  Tooltip,
  Badge,
  Progress,
} from '@chakra-ui/react';

interface Question {
  id: string;
  number: number;
  isAnswered: boolean;
  isCurrentQuestion: boolean;
}

interface QuestionNavigationProps {
  questions: Question[];
  currentQuestionIndex: number;
  onQuestionChange: (index: number) => void;
  timeRemaining: number;
  totalTime: number;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questions,
  currentQuestionIndex,
  onQuestionChange,
  timeRemaining,
  totalTime,
}) => {
  const timeProgress = (timeRemaining / totalTime) * 100;
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <Box>
      <Box mb={4} p={4} bg="white" borderRadius="md" boxShadow="sm">
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Time Remaining: {formatTime(timeRemaining)}
        </Text>
        <Progress
          value={timeProgress}
          colorScheme={timeProgress > 20 ? 'blue' : 'red'}
          size="sm"
          borderRadius="full"
        />
      </Box>

      <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
        <Text fontSize="md" fontWeight="medium" mb={3}>
          Questions:
        </Text>
        <HStack spacing={2} overflowX="auto" py={2}>
          {questions.map((question, index) => (
            <Tooltip
              key={question.id}
              label={question.isAnswered ? 'Answered' : 'Not answered'}
              placement="top"
            >
              <Button
                size="md"
                colorScheme={question.isAnswered ? 'green' : 'gray'}
                variant={question.isCurrentQuestion ? 'solid' : 'outline'}
                onClick={() => onQuestionChange(index)}
                position="relative"
              >
                {question.number}
                {question.isAnswered && (
                  <Badge
                    position="absolute"
                    top="-2"
                    right="-2"
                    colorScheme="green"
                    borderRadius="full"
                    size="xs"
                  >
                    ✓
                  </Badge>
                )}
              </Button>
            </Tooltip>
          ))}
        </HStack>
      </Box>
    </Box>
  );
};

export default QuestionNavigation;