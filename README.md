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

## How to Run the Application
1. **Clone the Repository:**
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd <YOUR_PROJECT_DIRECTORY>
   ```

2. **Install Dependencies:**
   For the backend:
   ```bash
   cd backend
   npm install
   ```

   For the frontend:
   ```bash
   cd ../src
   npm install
   ```

3. **Set Up Environment Variables:**
   Create a `.env` file in the backend directory and add your environment variables (e.g., database connection strings, API keys).

4. **Run the Backend:**
   ```bash
   cd backend
   npm start
   ```

5. **Run the Frontend:**
   ```bash
   cd ../src
   npm start
   ```

6. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000` to access the application.

## Key Features and Workflow of the App
1. **User Authentication (Login System):**
   - Secure login system for students and faculty.
   - Role-Based Access for different access levels.

2. **Exam Dashboard:**
   - Students see scheduled exams with details.
   - Countdown timer for active exams.

3. **Taking the Exam:**
   - Rich text editor for answers.
   - File upload for handwritten/drawn answers.
   - Autosave functionality.
   - Exam timer for automatic submission.

4. **Submitting the Exam:**
   - Submission sent to the corresponding faculty member.
   - Backend handles submissions based on subject mapping.

5. **Faculty Notification:**
   - Automatic notifications for faculty upon submission.

6. **Evaluation and Feedback:**
   - Faculty can grade submissions and provide feedback.

## Technology Stack
1. **Front-end:**
   - React Native or Flutter for cross-platform compatibility.
   - Responsive Design for tablets.

2. **Back-end:**
   - Firebase for real-time database and cloud storage.
   - Node.js/Express for managing authentication and routing.

3. **Security:**
   - Exam Lockdown Mode to prevent access to other apps.

4. **Submission Handling:**
   - Cloud storage for securely storing uploaded files.

## Implementation Steps
### Frontend
- **Canvas Integration:** Use a library for drawing capabilities.
- **Toolbar Implementation:** Fixed toolbar for tools.
- **Question Series Navigation:** Manage current question state.
- **Timer:** Implement countdown timer.

### Backend
- **Answer Management:** Store answers in a database.
- **Auto-Save API:** Create an API for real-time saving.
- **Final Submission API:** Validate and save the complete exam.

## Additional Features
- **Kiosk Mode:** Lock the tablet to the exam interface.
- **Offline Mode:** Save answers locally during network issues.

## Workflow Example
1. Student logs into the app and selects their exam from the dashboard.
2. Writes answers in the text editor or uploads PDFs/images for handwritten/drawn responses.
3. Submits the exam through the app.
4. Faculty receives the exam submission, reviews it, and provides feedback.
5. Students can later view their results and feedback on the app.
