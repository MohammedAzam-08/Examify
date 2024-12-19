import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import {
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';

interface AIProctoringProps {
  onViolation: (type: string) => void;
}

const AIProctoring: React.FC<AIProctoringProps> = ({ onViolation }) => {
  const webcamRef = useRef<Webcam>(null);
  const [model, setModel] = useState<faceDetection.FaceDetector | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const model = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        { runtime: 'tfjs' }
      );
      setModel(model);
    };
    loadModel();
  }, []);

  useEffect(() => {
    let frameId: number;
    let warningTimeout: NodeJS.Timeout;
    let noFaceCount = 0;
    let multipleFacesCount = 0;

    const detectFaces = async () => {
      if (webcamRef.current && model) {
        const video = webcamRef.current.video;
        if (video && video.readyState === 4) {
          const faces = await model.estimateFaces(video);

          if (faces.length === 0) {
            noFaceCount++;
            if (noFaceCount > 30) { // About 1 second at 30fps
              setWarning('No face detected');
              onViolation('no_face');
              noFaceCount = 0;
            }
          } else if (faces.length > 1) {
            multipleFacesCount++;
            if (multipleFacesCount > 30) {
              setWarning('Multiple faces detected');
              onViolation('multiple_faces');
              multipleFacesCount = 0;
            }
          } else {
            noFaceCount = 0;
            multipleFacesCount = 0;
            setWarning(null);
          }
        }
      }
      frameId = requestAnimationFrame(detectFaces);
    };

    detectFaces();

    return () => {
      cancelAnimationFrame(frameId);
      if (warningTimeout) clearTimeout(warningTimeout);
    };
  }, [model, onViolation]);

  return (
    <Box position="relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        width={320}
        height={240}
        screenshotFormat="image/jpeg"
        style={{
          borderRadius: '8px',
          border: warning ? '2px solid red' : '2px solid green',
        }}
      />
      {warning && (
        <Alert status="warning" mt={2}>
          <AlertIcon />
          <AlertTitle>Warning:</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
    </Box>
  );
};

export default AIProctoring;