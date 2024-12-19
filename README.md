# Examify

## Description
**Modules**

**Faculty Module:**
- Faculty logs in and creates exams.
- Uploads or adds questions.
- Sets exam timer and visibility for students.
- Reviews and grades submitted exams.

**Student Module:**
- Students log in to view and take exams.
- Navigate between questions.
- Use a whiteboard or answer area for responses.
- Submit answers manually or automatically on timer expiry.

## Application Structure

### 1. Frontend Development
**Tech Stack:**
- React.js: For dynamic UI components and state management.
- Fabric.js/Konva.js/HTML5 Canvas: For the whiteboard functionality where students draw/write answers.
- Tailwind CSS: For styling and responsive design.
- React-Toastify: For notifications like "Answer saved," "Time running out," etc.

**Components:**
- **Login Screen:** Common for students and faculty.
- **Dashboard:**
  - Faculty: Create/View exams.
  - Students: View available exams.
- **Exam Screen:**
  - Display questions dynamically.
  - Include a toolbar for whiteboard tools.
  - Timer: Show remaining time with warnings before expiry.
  - Submit Button: Manually or auto-submit answers.

### 2. Backend Development
**Tech Stack:**
- Node.js + Express.js: For creating RESTful APIs.
- MongoDB: To store drawing data and metadata efficiently.
- MySQL/PostgreSQL: To manage user data, exam metadata, and results.
- Firebase Storage: For saving whiteboard data as images or JSON.

**Key APIs:**
- **Authentication:** Login/Signup for students and faculty.
- **Exam Management:**
  - Create exams and questions.
  - Fetch questions for students.
- **Answer Management:**
  - Save answers in real-time (auto-save).
  - Validate and store submissions.
- **Timer Management:** Handle timer expiry and auto-submission.

### 3. Real-Time Features
- WebSockets/Firebase: Sync answers and provide real-time updates (e.g., warning messages).

### 4. Cloud Integration
- Firebase Storage or AWS S3: For uploading and retrieving whiteboard drawings.

## Flow of Exam Creation and Submission

**Faculty Flow:**
- Faculty logs in and accesses the dashboard.
- Creates a new exam:
  - Sets name, date, time, and duration.
  - Adds questions (MCQ, text, drawing options).
  - Publishes the exam for students to access.

**Student Flow:**
- Student logs in and selects an available exam.
- Exam Interface:
  - Question series visible as a navigation strip.
  - Whiteboard below for answers.
  - Timer running on top.
- Students:
  - Save answers manually or auto-save as they navigate.
  - Submit all answers via a "Submit" button or on timer expiry.
  - Backend validates and stores the submission.

## Core Features and Libraries
- **Question Navigation:** Use React state/context to handle question switching.
- **Whiteboard Integration:** Use Fabric.js for advanced drawing features.
- **Answer Auto-Save:** Call an API on navigation or at fixed intervals.
- **Timer and Auto-Submission:** Use a countdown timer with React hooks, triggering auto-submission on expiry.
- **Grading and Review:** Faculty views student submissions (images/drawings) and assigns grades.

## Database Schema
**Users Table:**
| Field | Type | Description |
|-------|------|-------------|
| id | Primary Key | Unique user ID |
| name | String | Name of user |
| role | String | 'Student' or 'Faculty' |

**Exams Table:**
| Field | Type | Description |
|-------|------|-------------|
| id | Primary Key | Unique exam ID |
| name | String | Exam title |
| faculty_id | Foreign Key | Faculty who created exam |

**Questions Table:**
| Field | Type | Description |
|-------|------|-------------|
| id | Primary Key | Unique question ID |
| exam_id | Foreign Key | Exam to which it belongs |
| type | String | 'MCQ', 'Text', 'Drawing' |

**Answers Table:**
| Field | Type | Description |
|-------|------|-------------|
| id | Primary Key | Unique answer ID |
| question_id | Foreign Key | Question to which it belongs |
| student_id | Foreign Key | Student who answered |
| data | JSON/BLOB | Answer content (text/image) |
