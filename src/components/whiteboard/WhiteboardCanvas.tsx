import React from 'react';
import Konva from 'konva';
import { LineElement, ShapeElement } from '../../types/whiteboard';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';

interface WhiteboardCanvasProps {
  stageSize: {
    width: number;
    height: number;
  };
  lines: LineElement[];
  shapes: ShapeElement[];
  tool: 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle';
  stageRef: React.RefObject<Konva.Stage>;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseUp: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  stageSize,
  lines,
  shapes,
  tool,
  stageRef,
  onMouseDown,
  onMouseMove,
  onMouseUp
}) => {
  return (
    <Stage
      width={stageSize.width}
      height={stageSize.height}
      onMouseDown={onMouseDown}
      onMousemove={onMouseMove}
      onMouseup={onMouseUp}
      onTouchStart={onMouseDown}
      onTouchMove={onMouseMove}
      onTouchEnd={onMouseUp}
      ref={stageRef}
      className="bg-white border"
      style={{ cursor: tool === 'pen' ? 'crosshair' : 'pointer' }}
    >
      <Layer>
        {(lines || []).map((line, i) => (
          <Line
            key={`line-${i}`}
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
        {(shapes || []).map((shape, i) => {
          if (shape.type === 'rectangle') {
            return (
              <Rect
                key={`rect-${i}`}
                x={shape.x}
                y={shape.y}
                width={shape.width || 0}
                height={shape.height || 0}
                stroke={shape.color}
                strokeWidth={shape.strokeWidth}
                fill="transparent"
              />
            );
          } else if (shape.type === 'circle') {
            const radius = shape.width ? shape.width / 2 : 0;
            return (
              <Circle
                key={`circle-${i}`}
                x={shape.x}
                y={shape.y}
                radius={radius}
                stroke={shape.color}
                strokeWidth={shape.strokeWidth}
                fill="transparent"
              />
            );
          } else if (shape.type === 'line') {
            return (
              <Line
                key={`shape-line-${i}`}
                points={[shape.x, shape.y, shape.x + (shape.width || 0), shape.y + (shape.height || 0)]}
                stroke={shape.color}
                strokeWidth={shape.strokeWidth}
                lineCap="round"
              />
            );
          }
          return null;
        })}
      </Layer>
    </Stage>
  );
};

export default WhiteboardCanvas;
