import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

// Import separated components
import ProgressSteps from '../../components/exam/ProgressSteps';
import ExamDetailsStep from '../../components/exam/ExamDetailsStep';
import QuestionsStep from '../../components/exam/QuestionsStep';
import SchedulingStep from '../../components/exam/SchedulingStep';
import ReviewStep from '../../components/exam/ReviewStep';
import NavigationButtons from '../../components/exam/NavigationButtons';

interface Question {
  id: string;
  text: string;
  points: number;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  course: string;
  semester: number;
}

interface ExamFormData {
  title: string;
  subject: string;
  course: string;
  semester: string;
  targetGroup: string;
  instructions: string;
  date: string;
  time: string;
  duration: number;
  questions: Question[];
  allowedStudents: string[];
}

const ExamCreation: React.FC = () => {
  const { examId } = useParams<{ examId?: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    subject: '',
    course: '',
    semester: '',
    targetGroup: '',
    instructions: '',
    date: '',
    time: '',
    duration: 60,
    questions: [],
    allowedStudents: [],
  });

  // Available courses - moved to ExamDetailsStep component

  useEffect(() => {
    if (examId) {
      const fetchExam = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/auth/login');
            return;
          }
          const response = await fetch(`/api/exams/${examId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch exam details');
          }
          const data = await response.json();

          // Populate form data with fetched exam details
          setFormData({
            title: data.title || '',
            subject: data.subject || '',
            course: data.course || '',
            semester: data.semester ? data.semester.toString() : '',
            targetGroup: data.targetGroup || '',
            instructions: data.instructions || '',
            date: data.scheduledStart ? new Date(data.scheduledStart).toISOString().split('T')[0] : '',
            time: data.scheduledStart ? new Date(data.scheduledStart).toISOString().split('T')[1].substring(0,5) : '',
            duration: data.duration || 60,
            questions: data.questions || [],
            allowedStudents: [],
          });
        } catch (error) {
          console.error('Error fetching exam details:', error);
        }
      };
      fetchExam();
    }
  }, [examId, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      points: 10,
    };
    const updatedFormData = {
      ...formData,
      questions: [...formData.questions, newQuestion],
    };
    console.log('Adding question, new formData:', updatedFormData);
    setFormData(updatedFormData);
  };

  const updateQuestion = (id: string, field: keyof Question, value: string | number) => {
    const updatedFormData = {
      ...formData,
      questions: formData.questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      ),
    };
    console.log('Updating question', id, field, value, 'new formData:', updatedFormData);
    setFormData(updatedFormData);
  };

  const removeQuestion = (id: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter(q => q.id !== id),
    });
  };
  
  const handleNext = () => {
    if (step < 4) {
      // If moving to questions step (step 2) and no questions exist, add one automatically
      if (step === 1 && formData.questions.length === 0) {
        addQuestion();
      }
      setStep(step + 1);
    }
  };
  
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found. Redirecting to login.');
        navigate('/auth/login');
        return;
      }

      // Fetch students enrolled in the selected course and semester
      let allowedStudentIds: string[] = [];
      try {
        console.log(`Fetching students for course: ${formData.course}, semester: ${formData.semester}`);
        const studentsResponse = await fetch(`/api/users/students?course=${formData.course}&semester=${formData.semester}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (studentsResponse.ok) {
          const students: Student[] = await studentsResponse.json();
          allowedStudentIds = students.map((student) => student._id);
          console.log(`Found ${allowedStudentIds.length} students for ${formData.course} ${formData.semester} semester:`, students);
        } else {
          console.warn('Failed to fetch students, response:', studentsResponse.status, studentsResponse.statusText);
        }
      } catch (error) {
        console.warn('Error fetching students:', error);
      }

      const scheduledStart = new Date(`${formData.date}T${formData.time}`).toISOString();

      const examData = {
        title: formData.title,
        subject: formData.subject,
        course: formData.course,
        semester: parseInt(formData.semester),
        targetGroup: formData.targetGroup,
        instructions: formData.instructions,
        duration: parseInt(formData.duration.toString()),
        scheduledStart,
        questions: formData.questions,
        enrolledStudents: allowedStudentIds,
      };

      let response;
      if (examId) {
        // Update existing exam
        response = await fetch(`/api/exams/${examId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(examData),
        });
      } else {
        // Create new exam
        response = await fetch('/api/exams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(examData),
        });
      }

      if (!response.ok) {
        throw new Error(examId ? 'Failed to update exam' : 'Failed to create exam');
      }

      // Wait for the data to be processed
      const result = await response.json();
      console.log('Exam saved successfully:', result);
      
      // Add a small delay before navigation to ensure server processing completes
      setTimeout(() => {
        setSaving(false);
        navigate('/instructor', { 
          state: { 
            success: true, 
            message: examId ? 'Exam updated successfully!' : 'New exam created successfully!' 
          } 
        });
      }, 1000);
    } catch (error) {
      console.error('Error saving exam:', error);
      setSaving(false);
      // Show error to the user (you could add state for this)
      alert(examId ? 'Failed to update exam. Please try again.' : 'Failed to create exam. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mr-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {examId ? 'Edit Exam' : 'Create New Exam'}
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                {examId ? 'Update your exam details' : 'Set up a comprehensive whiteboard exam for your students'}
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Progress Steps */}
        <ProgressSteps currentStep={step} />
        
        {/* Main Form Container */}
        <motion.div 
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            {/* Step Content */}
            {step === 1 && (
              <ExamDetailsStep 
                formData={formData} 
                onInputChange={handleInputChange} 
              />
            )}

            {step === 2 && (
              <QuestionsStep
                questions={formData.questions}
                onAddQuestion={addQuestion}
                onUpdateQuestion={updateQuestion}
                onRemoveQuestion={removeQuestion}
              />
            )}
            
            {step === 3 && (
              <SchedulingStep
                formData={formData}
                onInputChange={handleInputChange}
              />
            )}
            
            {step === 4 && (
              <ReviewStep
                formData={formData}
                isEdit={!!examId}
              />
            )}
            
            {/* Navigation Buttons */}
            <NavigationButtons
              currentStep={step}
              totalSteps={4}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onCancel={() => navigate('/instructor')}
              onSubmit={handleSubmit}
              saving={saving}
              isEdit={!!examId}
            />
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamCreation;