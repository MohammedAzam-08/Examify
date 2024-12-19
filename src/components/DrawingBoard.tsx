import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import {
  Box,
  HStack,
  IconButton,
  Button,
  ButtonGroup,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FaPencilAlt,
  FaEraser,
  FaSquare,
  FaCircle,
  FaUndo,
  FaRedo,
  FaSave,
  FaPalette,
} from 'react-icons/fa';

interface Point {
  x: number;
  y: number;
}

interface Line {
  tool: string;
  points: number[];
  color: string;
  strokeWidth: number;
}

interface DrawingBoardProps {
  questionId: string;
  examId: string;
  onSave: (data: string) => void;
  initialData?: string;
}

const DrawingBoard: React.FC<DrawingBoardProps> = ({
  questionId,
  examId,
  onSave,
  initialData,
}) => {
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rectangle' | 'circle'>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<Line[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const stageRef = useRef<any>(null);
  const toast = useToast();

  const colors = ['#000000', '#FF0000', '#0000FF', '#008000'];

  useEffect(() => {
    if (initialData) {
      try {
        const parsedData = JSON.parse(initialData);
        setLines(parsedData.lines || []);
        setHistory([parsedData.lines || []]);
        setHistoryStep(0);
      } catch (error) {
        console.error('Error parsing initial data:', error);
      }
    }
  }, [initialData]);

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    const newLine: Line = {
      tool,
      points: [pos.x, pos.y],
      color: tool === 'eraser' ? '#FFFFFF' : color,
      strokeWidth: tool === 'eraser' ? strokeWidth * 2 : strokeWidth,
    };
    setCurrentLine(newLine);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const newLine = {
      ...currentLine!,
      points: [...currentLine!.points, point.x, point.y],
    };
    setCurrentLine(newLine);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (currentLine) {
      const newLines = [...lines, currentLine];
      setLines(newLines);
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newLines);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
      setCurrentLine(null);
    }
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setLines(history[historyStep - 1]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setLines(history[historyStep + 1]);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        lines,
        timestamp: new Date().toISOString(),
      };
      await onSave(JSON.stringify(data));
      toast({
        title: 'Saved',
        description: 'Your answer has been saved successfully',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save your answer',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Box
        border="1px"
        borderColor="gray.200"
        borderRadius="md"
        overflow="hidden"
        mb={4}
        h="600px"
        position="relative"
      >
        <Stage
          width={window.innerWidth * 0.8}
          height={600}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
            {currentLine && (
              <Line
                points={currentLine.points}
                stroke={currentLine.color}
                strokeWidth={currentLine.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  currentLine.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            )}
          </Layer>
        </Stage>
      </Box>

      <HStack spacing={4} justify="space-between">
        <ButtonGroup isAttached variant="outline">
          <IconButton
            aria-label="Pen tool"
            icon={<FaPencilAlt />}
            isActive={tool === 'pen'}
            onClick={() => setTool('pen')}
          />
          <IconButton
            aria-label="Eraser tool"
            icon={<FaEraser />}
            isActive={tool === 'eraser'}
            onClick={() => setTool('eraser')}
          />
          <IconButton
            aria-label="Rectangle tool"
            icon={<FaSquare />}
            isActive={tool === 'rectangle'}
            onClick={() => setTool('rectangle')}
          />
          <IconButton
            aria-label="Circle tool"
            icon={<FaCircle />}
            isActive={tool === 'circle'}
            onClick={() => setTool('circle')}
          />
        </ButtonGroup>

        <Menu>
          <MenuButton as={Button} leftIcon={<FaPalette />}>
            Color
          </MenuButton>
          <MenuList>
            {colors.map((c) => (
              <MenuItem
                key={c}
                onClick={() => setColor(c)}
                icon={
                  <Box w="20px" h="20px" bg={c} borderRadius="sm" />
                }
              >
                {c === '#000000' ? 'Black' : 
                 c === '#FF0000' ? 'Red' : 
                 c === '#0000FF' ? 'Blue' : 'Green'}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        <Box w="200px">
          <Slider
            value={strokeWidth}
            min={1}
            max={20}
            onChange={setStrokeWidth}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        <ButtonGroup>
          <IconButton
            aria-label="Undo"
            icon={<FaUndo />}
            onClick={handleUndo}
            isDisabled={historyStep === 0}
          />
          <IconButton
            aria-label="Redo"
            icon={<FaRedo />}
            onClick={handleRedo}
            isDisabled={historyStep === history.length - 1}
          />
          <Button
            leftIcon={<FaSave />}
            colorScheme="blue"
            onClick={handleSave}
          >
            Save
          </Button>
        </ButtonGroup>
      </HStack>
    </Box>
  );
};

export default DrawingBoard;