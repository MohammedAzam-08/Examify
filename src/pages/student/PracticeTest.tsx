import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  Send,
  BookOpen,
  Target,
  Trophy,
  X
} from 'lucide-react';

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

interface PracticeTestData {
  _id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  questions: Question[];
  totalPoints: number;
  passingScore: number;
}

interface TestResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  percentage: number;
  passed: boolean;
  timeTaken: string;
  answers: { [questionId: string]: number | null };
}

const PracticeTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState<PracticeTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: number | null }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchTestData();
    }
  }, [testId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testStarted && !testCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testStarted, testCompleted, timeLeft]);

  const fetchTestData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }
      
      if (!testId) {
        setError('Test ID is missing. Please go back and try again.');
        return;
      }
      
      // Fetch the practice test from the API
      const response = await fetch(`/api/study-materials/${testId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load practice test: ${response.status} ${errorText}`);
      }
      
      const studyMaterial = await response.json();
      
      // Validate that this is a practice test with questions
      if (studyMaterial.type !== 'practice') {
        throw new Error('The requested resource is not a practice test.');
      }
      
      if (!studyMaterial.questions || studyMaterial.questions.length === 0) {
        throw new Error('This practice test has no questions.');
      }
      
      // Map the study material to our test data format
      const testData: PracticeTestData = {
        _id: studyMaterial._id,
        title: studyMaterial.title,
        description: studyMaterial.description,
        subject: studyMaterial.subject,
        difficulty: studyMaterial.difficulty,
        duration: studyMaterial.duration || '30:00', // Default to 30 minutes if not set
        questions: studyMaterial.questions.map((q: Question) => ({
          _id: q._id || `q${Math.random().toString(36).substr(2, 9)}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          points: q.points
        })),
        totalPoints: studyMaterial.totalPoints || 
          studyMaterial.questions.reduce((sum: number, q: Question) => sum + (q.points || 0), 0),
        passingScore: studyMaterial.passingScore || 70
      };

      setTestData(testData);
      
      // Parse duration and set timer
      const [minutes, seconds] = (testData.duration || '30:00').split(':').map(Number);
      setTimeLeft(minutes * 60 + (seconds || 0));
      
    } catch (err) {
      console.error('Error fetching test data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load practice test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
    // Record start time for analytics
    localStorage.setItem(`test_${testId}_startTime`, Date.now().toString());
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (testData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = () => {
    if (!testData) return;

    const startTime = localStorage.getItem(`test_${testId}_startTime`);
    const endTime = Date.now();
    const timeTaken = startTime ? Math.floor((endTime - parseInt(startTime)) / 1000) : 0;

    let correctAnswers = 0;
    let totalScore = 0;
    let skippedQuestions = 0;

    testData.questions.forEach(question => {
      const userAnswer = answers[question._id];
      if (userAnswer === null || userAnswer === undefined) {
        skippedQuestions++;
      } else if (userAnswer === question.correctAnswer) {
        correctAnswers++;
        totalScore += question.points;
      }
    });

    const percentage = Math.round((correctAnswers / testData.questions.length) * 100);
    const passed = percentage >= (testData.passingScore || 70);

    const result: TestResult = {
      score: totalScore,
      totalQuestions: testData.questions.length,
      correctAnswers,
      wrongAnswers: testData.questions.length - correctAnswers - skippedQuestions,
      skippedQuestions,
      percentage,
      passed,
      timeTaken: formatTime(timeTaken),
      answers
    };

    setTestResult(result);
    setTestCompleted(true);
    setShowConfirmSubmit(false);

    // Clear start time
    localStorage.removeItem(`test_${testId}_startTime`);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionIndex: number): 'answered' | 'current' | 'unanswered' => {
    const question = testData?.questions[questionIndex];
    if (!question) return 'unanswered';
    
    if (questionIndex === currentQuestionIndex) return 'current';
    return answers[question._id] !== undefined ? 'answered' : 'unanswered';
  };

  const getCurrentQuestion = () => {
    return testData?.questions[currentQuestionIndex];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-600">Loading practice test...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="text-center p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-4">{error || 'Practice test not found'}</p>
          <button
            onClick={() => navigate('/student/study-resources')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Study Resources
          </button>
        </motion.div>
      </div>
    );
  }

  // Review mode - show answers and explanations
  if (reviewMode && testData && testResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setReviewMode(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{testData.title} - Review</h1>
                  <p className="text-gray-600">Score: {testResult.percentage}% ({testResult.correctAnswers} of {testResult.totalQuestions} correct)</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/student/study-resources')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Back to Resources
              </button>
            </div>
          </div>

          <div className="space-y-8 mb-8">
            {testData.questions.map((question, qIndex) => {
              const userAnswer = testResult.answers[question._id];
              const isCorrect = userAnswer === question.correctAnswer;
              const isSkipped = userAnswer === undefined || userAnswer === null;
              
              return (
                <motion.div 
                  key={question._id}
                  className="bg-white rounded-lg shadow-md p-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qIndex * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Question {qIndex + 1}</h3>
                    {isSkipped ? (
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium">
                        Skipped
                      </span>
                    ) : isCorrect ? (
                      <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                        Correct
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-medium">
                        Incorrect
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-900 mb-4">{question.question}</p>
                  
                  <div className="space-y-3 mb-6">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex}
                        className={`p-3 rounded-lg border ${
                          oIndex === question.correctAnswer
                            ? 'border-green-500 bg-green-50'
                            : oIndex === userAnswer && oIndex !== question.correctAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                            oIndex === question.correctAnswer
                              ? 'bg-green-500 text-white'
                              : oIndex === userAnswer && oIndex !== question.correctAnswer
                              ? 'bg-red-500 text-white'
                              : 'border border-gray-300'
                          }`}>
                            {oIndex === question.correctAnswer && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {oIndex === userAnswer && oIndex !== question.correctAnswer && (
                              <X className="w-3 h-3" />
                            )}
                          </div>
                          <span className="font-medium mr-3">{String.fromCharCode(65 + oIndex)}.</span>
                          <span>{option}</span>
                          {oIndex === question.correctAnswer && (
                            <span className="ml-auto text-xs text-green-600 font-medium">Correct Answer</span>
                          )}
                          {oIndex === userAnswer && oIndex !== question.correctAnswer && (
                            <span className="ml-auto text-xs text-red-600 font-medium">Your Answer</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {question.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-1">Explanation</h4>
                      <p className="text-blue-900 text-sm">{question.explanation}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setReviewMode(false)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Results
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retake Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test completed - show results
  if (testCompleted && testResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            className="bg-white rounded-lg shadow-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {testResult.passed ? (
                  <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                ) : (
                  <Target className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                )}
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {testResult.passed ? 'Congratulations!' : 'Test Completed'}
              </h1>
              <p className="text-lg text-gray-600">
                {testResult.passed 
                  ? 'You passed the practice test!' 
                  : 'Keep practicing to improve your score!'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{testResult.percentage}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{testResult.correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{testResult.wrongAnswers}</div>
                <div className="text-sm text-gray-600">Wrong Answers</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-600">{testResult.timeTaken}</div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setReviewMode(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Review Answers
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Retake Test
              </button>
              <button
                onClick={() => navigate('/student/study-resources')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Resources
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Pre-test information screen
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            className="bg-white rounded-lg shadow-lg p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigate('/student/study-resources')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{testData.title}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Test Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium">{testData.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      testData.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      testData.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {testData.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{testData.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{testData.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Points:</span>
                    <span className="font-medium">{testData.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Passing Score:</span>
                    <span className="font-medium">{testData.passingScore}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                <ul className="space-y-2 text-gray-600">
                  <li>• Read each question carefully before selecting an answer</li>
                  <li>• You can navigate between questions using the navigation buttons</li>
                  <li>• Your progress is automatically saved</li>
                  <li>• The test will auto-submit when time runs out</li>
                  <li>• You can review your answers before submitting</li>
                  <li>• Once submitted, you cannot change your answers</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800">
                  Make sure you have a stable internet connection before starting the test.
                </p>
              </div>
            </div>

            <div className="text-center">
              <motion.button
                onClick={handleStartTest}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Practice Test
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">{testData.title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <h3 className="font-semibold mb-4">Question Navigation</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {testData.questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        status === 'current' 
                          ? 'bg-blue-600 text-white' 
                          : status === 'answered'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-xs space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-2"></div>
                  <span>Not Answered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={currentQuestionIndex}
              className="bg-white rounded-lg shadow p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Question {currentQuestionIndex + 1} of {testData.questions.length}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentQuestion.difficulty} • {currentQuestion.points} pts
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-medium text-gray-900 mb-6">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion._id, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers[currentQuestion._id] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        answers[currentQuestion._id] === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[currentQuestion._id] === index && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === testData.questions.length - 1}
                  className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="flex items-center mb-4">
                <Send className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold">Submit Test</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to submit your test? You won't be able to change your answers after submission.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTest}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PracticeTest;
