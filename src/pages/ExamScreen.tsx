import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Timer from '../components/Timer';
import DrawingCanvas from '../components/DrawingCanvas';
import QuestionNavigation from '../components/QuestionNavigation';
import AIProctoring from '../components/AIProctoring';

// Define interfaces
interface Exam {
  _id: string;
  duration: number;
  questions: Question[];
}

interface Question {
  _id: string;
  question: string;
}

interface Violation {
  type: string;
  timestamp: Date;
}

interface QuestionNavigationProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: Set<number>;
  onQuestionChange: (question: number) => void;
}

interface DrawingCanvasProps {
  questionId: string;
  examId: string;
  onSave: (drawingData: any) => Promise<void>;
}

const ExamScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const [violations, setViolations] = useState<Violation[]>([]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/exams/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
        setExam(data);
        
        // Load answered questions
        const answers = await axios.get(
          `http://localhost:5000/api/answers/${id}/all`,
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
        const answered = new Set(answers.data.map((a: any) => a.questionNumber as number));
        setAnsweredQuestions(answered);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch exam',
          status: 'error',
          duration: 3000,
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, user.token, toast, navigate]);

  const handleSaveAnswer = async (drawingData: any) => {
    try {
      await axios.post(
        `http://localhost:5000/api/answers/${id}/questions/${currentQuestion}`,
        { drawingData },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      
      setAnsweredQuestions(prev => new Set([...prev, currentQuestion]));
      
      toast({
        title: 'Success',
        description: 'Answer saved successfully',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save answer',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleViolation = (type: string) => {
    setViolations(prev => [...prev, { type, timestamp: new Date() }]);
    // You can implement additional logic here, like automatic submission after X violations
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/answers/${id}/submit`,
        { violations },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      
      toast({
        title: 'Success',
        description: 'Exam submitted successfully',
        status: 'success',
        duration: 3000,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit exam',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!exam) {
    return <Text>Exam not found</Text>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Grid templateColumns="1fr 320px" gap={8}>
        <GridItem>
          <VStack spacing={6} align="stretch">
            <Box position="sticky" top={0} bg="white" p={4} zIndex={1}>
              <Timer
                initialTime={exam.duration * 60}
                onTimeUp={handleSubmit}
              />
            </Box>

            <QuestionNavigation
              totalQuestions={exam.questions.length}
              currentQuestion={currentQuestion}
              answeredQuestions={answeredQuestions}
              onQuestionChange={(question: number) => setCurrentQuestion(question)}
            />

            <Box bg="white" p={6} borderRadius="md" boxShadow="md">
              <Heading size="lg" mb={6}>
                Question {currentQuestion}: {exam.questions[currentQuestion - 1].question}
              </Heading>

              <DrawingCanvas
                questionId={exam.questions[currentQuestion - 1]._id}
                examId={exam._id}
                onSave={handleSaveAnswer}
              />

              <Button
                colorScheme="blue"
                size="lg"
                width="full"
                mt={6}
                onClick={handleSubmit}
              >
                Submit Exam
              </Button>
            </Box>
          </VStack>
        </GridItem>

        <GridItem>
          <Box position="sticky" top={0}>
            <AIProctoring onViolation={handleViolation} />
            {violations.length > 0 && (
              <Alert status="warning" mt={4}>
                <AlertIcon />
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Violations Detected:</Text>
                  {violations.slice(-3).map((v, i) => (
                    <Text key={i} fontSize="sm">
                      {v.type} at {v.timestamp.toLocaleTimeString()}
                    </Text>
                  ))}
                </VStack>
              </Alert>
            )}
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default ExamScreen;