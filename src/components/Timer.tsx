import { useState, useEffect } from 'react';
import { Box, Text, Progress } from '@chakra-ui/react';

const Timer = ({ initialTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (!timeLeft) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / initialTime) * 100;

  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" textAlign="center">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Text>
      <Progress
        value={percentage}
        colorScheme={percentage > 20 ? 'blue' : 'red'}
        size="sm"
        mt={2}
      />
    </Box>
  );
};

export default Timer;