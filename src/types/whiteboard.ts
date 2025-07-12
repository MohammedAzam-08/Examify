// Define common types for whiteboard functionality
export interface LineElement {
  points: number[];
  tool: string;
  color: string;
  strokeWidth: number;
}

export interface ShapeElement {
  id?: string;
  type: 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  color: string;
  strokeWidth: number;
}

export interface WhiteboardPageData {
  lines: LineElement[];
  shapes: ShapeElement[];
}

export interface WhiteboardState {
  pages: { [key: number]: WhiteboardPageData };
  currentPage: number;
  tool: 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle';
  currentColor: string;
  lines: LineElement[];
  shapes: ShapeElement[];
  isDrawing: boolean;
  startPos: { x: number; y: number } | null;
  saved: boolean;
  stageSize: {
    width: number;
    height: number;
  };
}

export interface ExamData {
  _id: string;
  title: string;
  instructions: string;
  duration: number;
  scheduledStart: string;
  questions: Array<{
    text: string;
    points: number;
  }>;
}
