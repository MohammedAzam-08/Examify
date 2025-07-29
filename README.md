# 📝 Examify — Online Examination Portal

**Examify** is a secure, full-featured, and scalable online exam platform built using the **MERN stack** with **TypeScript**. It allows educators to create and manage exams, and students to take them seamlessly in a web-based environment. It supports authentication, role-based access, real-time interaction, and persistent data storage.

> 📍 Project Status: Under Active Development (2025 MCA Final Year Project)

---

## 📣 Project Overview

This project simulates a real-world digital examination system with two main user roles:  
- 👩‍🏫 **Teachers**: Can create exams, assign marks, and manage student performance.  
- 🧑‍🎓 **Students**: Can attend exams, submit answers, and view results.

The system includes a responsive UI, secure authentication, and a RESTful backend.

---

## 📌 Key Features

- 🔐 **JWT-based Authentication** for Students & Teachers
- 🛂 **Role-Based Access Control** for different user permissions
- 📝 **Create/Manage Exams** (MCQs, subjective questions, timers)
- 📊 **Result Evaluation & Performance Analytics**
- 🌐 **Fully Responsive Interface** (Mobile + Desktop)
- ⚡ Real-time feedback and alert messages
- 🧪 Integrated functional testing for core features

---

## 🛠️ Technology Stack

| Frontend            | Backend                | Database  | Styling         | Tools & DevOps     |
|---------------------|------------------------|-----------|------------------|---------------------|
| React.js + TypeScript | Node.js, Express.js     | MongoDB   | Tailwind CSS     | Vite, Git, Postman  |
| React Router        | RESTful APIs           | Mongoose  | PostCSS          | ESLint, Netlify     |

---

## 📂 Folder Structure

├── src/ # React client-side code
│ ├── components/ # Reusable UI components
│ ├── pages/ # Pages (Login, Dashboard, Exam, Result)
│ ├── services/ # API calls, JWT utils
│ └── styles/ # Tailwind CSS config
│
├── server/ # Backend source code (Node + Express)
│ ├── models/ # Mongoose schemas (User, Exam, Results)
│ ├── routes/ # Auth, exam, student/teacher routes
│ ├── middleware/ # JWT auth, error handling
│ └── config/ # DB connection, environment

yaml
Copy
Edit

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/MohammedAzam-08/Examify.git
cd Examify
2️⃣ Install Dependencies
For Frontend:
bash
Copy
Edit
cd src
npm install
npm run dev
For Backend:
bash
Copy
Edit
cd server
npm install
npm start
Ensure your MongoDB server is running locally or via cloud (MongoDB Atlas).

🔐 Environment Variables
Create a .env file in the server/ directory:

env
Copy
Edit
PORT=5000
MONGO_URI=mongodb+srv://<your-connection-string>
JWT_SECRET=your_jwt_secret_key
🧪 Testing Instructions
🧾 Manual testing of login/authentication using Postman

✅ Functional testing for question submission and evaluation

📱 Responsive tests using browser developer tools (mobile/tablet/desktop)


🧠 Future Enhancements
 Timer-based auto-submit for exams

 Result export as PDF/CSV

 Leaderboard integration

 Live proctoring integration (camera & mic detection)

 Unit testing with Jest & React Testing Library

🎓 Academic Context
This project is a capstone submission for:

Yenepoya University (2025)
🧾 23MCAI18_PG_4th_sem_Project_2025

👨‍💻 Author
Mohammed Azam
Full Stack Developer | QA Tester | MCA '25
📍 Bengaluru, India
🔗 Portfolio | LinkedIn | GitHub

⭐ Feedback & Contributions
If you find this project helpful or insightful:

Star 🌟 the repo

Share it with your network

Raise issues or suggest features

"Bringing smart, scalable solutions to modern education through secure web development."
