import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Book,
  Bookmark,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardSet {
  _id: string;
  title: string;
  description: string;
  subject: string;
  course: string;
  cards: number;
  content: string;
  instructor: {
    name: string;
    email: string;
  };
}

const FlashcardStudy: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [studyComplete, setStudyComplete] = useState(false);
  
  useEffect(() => {
    if (setId) {
      fetchFlashcardSet();
    }
  }, [setId]);
  
  const fetchFlashcardSet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }
      
      // Fetch the flashcard set from the API
      const response = await fetch(`/api/study-materials/${setId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load flashcard set: ${response.status} ${errorText}`);
      }
      
      const studyMaterial = await response.json();
      
      // Validate that this is a flashcard type
      if (studyMaterial.type !== 'flashcard') {
        throw new Error('The requested resource is not a flashcard set.');
      }
      
      setFlashcardSet(studyMaterial);
      
      // Parse content into flashcards (assume format: front|back\nfront|back)
      if (studyMaterial.content) {
        const parsedFlashcards = parseFlashcardContent(studyMaterial.content);
        setFlashcards(parsedFlashcards);
      } else {
        setFlashcards([]);
        setError('This flashcard set has no cards.');
      }
      
    } catch (err) {
      console.error('Error fetching flashcard set:', err);
      setError(err instanceof Error ? err.message : 'Failed to load flashcard set. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Parse content in format: front|back\nfront|back
  const parseFlashcardContent = (content: string): Flashcard[] => {
    console.log('Parsing flashcard content:', content);
    
    // Handle different possible line break formats
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    console.log('Split into lines:', lines);
    
    const cards = lines.map(line => {
      // Use various possible delimiters
      let parts;
      if (line.includes('|')) {
        parts = line.split('|');
      } else if (line.includes(':')) {
        parts = line.split(':');
      } else if (line.includes('-')) {
        parts = line.split('-');
      } else {
        // If no delimiter found, try to split by the first dot or comma
        const dotIndex = line.indexOf('.');
        const commaIndex = line.indexOf(',');
        
        if (dotIndex > 0) {
          parts = [line.substring(0, dotIndex).trim(), line.substring(dotIndex + 1).trim()];
        } else if (commaIndex > 0) {
          parts = [line.substring(0, commaIndex).trim(), line.substring(commaIndex + 1).trim()];
        } else {
          // If all else fails, split the string in half
          const midpoint = Math.floor(line.length / 2);
          parts = [line.substring(0, midpoint).trim(), line.substring(midpoint).trim()];
        }
      }
      
      const front = parts[0]?.trim();
      const back = parts[1]?.trim();
      
      // Only create cards if we have something for both front and back
      if (front && back) {
        return { front, back };
      }
      return null;
    });
    
    const validCards = cards.filter((card): card is Flashcard => card !== null);
    console.log('Created flashcards:', validCards);
    
    return validCards;
  };
  
  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };
  
  const nextCard = () => {
    setIsFlipped(false);
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Completed all cards
      setStudyComplete(true);
    }
  };
  
  const previousCard = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };
  
  const markAsKnown = () => {
    setKnownCards(new Set(knownCards.add(currentCardIndex)));
    nextCard();
  };
  
  const resetStudy = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setStudyComplete(false);
  };
  
  const studyAgain = () => {
    // Only study cards not marked as known
    const remainingCards: Flashcard[] = [];
    flashcards.forEach((card, index) => {
      if (!knownCards.has(index)) {
        remainingCards.push(card);
      }
    });
    
    if (remainingCards.length === 0) {
      // All cards are marked as known
      setStudyComplete(true);
    } else {
      setFlashcards(remainingCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setKnownCards(new Set());
    }
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
            className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-600">Loading flashcards...</p>
        </motion.div>
      </div>
    );
  }
  
  if (error || !flashcardSet || flashcards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="text-center p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Flashcards</h2>
          <p className="text-gray-600 mb-4">{error || 'Flashcard set not found or has no cards'}</p>
          <button
            onClick={() => navigate('/student/study-resources')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Study Resources
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Study complete view
  if (studyComplete) {
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
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Study Session Complete!
              </h1>
              <p className="text-lg text-gray-600">
                You've studied all {flashcardSet.cards} cards in this set.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold mb-4">Study Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <div className="text-3xl font-bold text-purple-600">{flashcards.length}</div>
                  <div className="text-sm text-gray-600">Total Cards</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <div className="text-3xl font-bold text-green-600">{knownCards.size}</div>
                  <div className="text-sm text-gray-600">Cards Mastered</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <div className="text-3xl font-bold text-orange-600">{flashcards.length - knownCards.size}</div>
                  <div className="text-sm text-gray-600">Need More Review</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <div className="text-3xl font-bold text-blue-600">{Math.round((knownCards.size / flashcards.length) * 100)}%</div>
                  <div className="text-sm text-gray-600">Mastery Level</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetStudy}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Study All Cards Again
              </button>
              {knownCards.size < flashcards.length && (
                <button
                  onClick={studyAgain}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Review Cards You Missed
                </button>
              )}
              <button
                onClick={() => navigate('/student/study-resources')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
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
  
  // Current card view
  const currentCard = flashcards[currentCardIndex];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/student/study-resources')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{flashcardSet.title}</h1>
            <p className="text-gray-600">{flashcardSet.subject} • Card {currentCardIndex + 1} of {flashcards.length}</p>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="relative h-[300px] md:h-[400px]">
            <motion.div
              className={`absolute inset-0 bg-white rounded-xl shadow-lg p-6 flex flex-col ${
                isFlipped ? 'bg-blue-50' : 'bg-white'
              }`}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              style={{ backfaceVisibility: 'hidden' }}
              onClick={flipCard}
            >
              {!isFlipped && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="absolute top-4 left-4">
                    <Book className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 text-center">
                    {currentCard.front}
                  </h2>
                  <p className="text-gray-500 mt-6 text-center">Click to reveal answer</p>
                </div>
              )}
            </motion.div>
            
            <motion.div
              className="absolute inset-0 bg-blue-50 rounded-xl shadow-lg p-6 flex flex-col"
              animate={{ rotateY: isFlipped ? 0 : -180 }}
              transition={{ duration: 0.5 }}
              style={{ backfaceVisibility: 'hidden' }}
              onClick={flipCard}
            >
              {isFlipped && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="absolute top-4 left-4">
                    <Bookmark className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 text-center">
                    {currentCard.back}
                  </h2>
                  <p className="text-gray-500 mt-6 text-center">Click to see question</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <button
              onClick={previousCard}
              disabled={currentCardIndex === 0}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
          </div>
          
          <div className="flex-1 text-center">
            <button
              onClick={markAsKnown}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              I Know This
            </button>
          </div>
          
          <div className="flex-1 text-right">
            <button
              onClick={nextCard}
              className="flex items-center px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors ml-auto"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
        
        <div className="mt-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Card {currentCardIndex + 1}</span>
            <span>{flashcards.length} cards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardStudy;
