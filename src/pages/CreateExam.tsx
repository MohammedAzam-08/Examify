import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CreateExam = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', marks: '' },
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('userInfo') || '{}')?.token;
      await axios.post(
        'http://localhost:5000/api/exams',
        {
          title,
          subject,
          duration: Number(duration),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          questions: questions.map((q) => ({
            question: q.question,
            marks: Number(q.marks),
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(
        <div>
          <strong>Exam created successfully</strong>
          <div>Exam has been created and saved to the database.</div>
        </div>,
        {
          autoClose: 5000,
        }
      );
      navigate('/');
    } catch (error) {
      console.error('Exam creation error:', error);
      toast.error(
        <div>
          <strong>Failed to create exam</strong>
          <div>An error occurred while creating the exam. Please try again later.</div>
        </div>,
        {
          autoClose: 5000,
        }
      );
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', marks: '' }]);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((q, i) => i !== index));
  };

  const handleQuestionChange = (index, e) => {
    const { name, value } = e.target;
    setQuestions(
      questions.map((q, i) =>
        i === index ? { ...q, [name]: value } : q
      )
    );
  };

  return (
    <div className="container">
      <h1>Create Exam</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Subject:</label>
          <input
            type="text"
            className="form-control"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Duration:</label>
          <input
            type="number"
            className="form-control"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Start Time:</label>
          <input
            type="datetime-local"
            className="form-control"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>End Time:</label>
          <input
            type="datetime-local"
            className="form-control"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <h2>Questions:</h2>
        {questions.map((q, index) => (
          <div key={index} className="form-group">
            <label>Question {index + 1}:</label>
            <input
              type="text"
              className="form-control"
              name="question"
              value={q.question}
              onChange={(e) => handleQuestionChange(index, e)}
            />
            <label>Marks:</label>
            <input
              type="number"
              className="form-control"
              name="marks"
              value={q.marks}
              onChange={(e) => handleQuestionChange(index, e)}
            />
                        <button
              type="button"
              className="btn btn-danger"
              onClick={() => handleRemoveQuestion(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddQuestion}
        >
          Add Question
        </button>
        <button
          type="submit"
          className="btn btn-success"
        >
          Create Exam
        </button>
      </form>
    </div>
  );
};

export default CreateExam;