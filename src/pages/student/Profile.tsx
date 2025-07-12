import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 50,
      damping: 12,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const Profile: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [course, setCourse] = useState(user?.course ?? '');
  const [semester, setSemester] = useState(user?.semester ?? 1);
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setCourse(user.course);
      setSemester(user.semester);
    }
  }, [user]);

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password && !oldPassword) {
      setError('Please enter your current password to set a new password');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        name,
        email,
        course,
        semester,
        oldPassword: oldPassword || undefined,
        password: password || undefined,
      });
      setMessage('Profile updated successfully');
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-blue-50 shadow-2xl rounded-2xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-3xl font-bold text-blue-700 mb-8 text-center"
        variants={itemVariants}
      >
        My Profile
      </motion.h2>

      {message && (
        <motion.div
          className="mb-4 px-4 py-3 rounded bg-green-100 text-green-800 border border-green-300"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {message}
        </motion.div>
      )}

      {error && (
        <motion.div
          className="mb-4 px-4 py-3 rounded bg-red-100 text-red-800 border border-red-300"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {error}
        </motion.div>
      )}

      <motion.form
        onSubmit={submitHandler}
        className="space-y-6"
        variants={containerVariants}
      >
        {[
          { id: 'name', label: 'Name', value: name, onChange: setName, type: 'text' },
          { id: 'email', label: 'Email', value: email, onChange: setEmail, type: 'email' },
          { id: 'course', label: 'Course', value: course, onChange: setCourse, type: 'text' },
        ].map(({ id, label, value, onChange, type }) => (
          <motion.div key={id} variants={itemVariants}>
            <label htmlFor={id} className="block font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              id={id}
              type={type}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              required
            />
          </motion.div>
        ))}

        <motion.div variants={itemVariants}>
          <label htmlFor="semester" className="block font-medium text-gray-700 mb-1">
            Semester
          </label>
          <input
            id="semester"
            type="number"
            min={1}
            max={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            required
          />
        </motion.div>

        {[
          { id: 'oldPassword', label: 'Current Password', value: oldPassword, onChange: setOldPassword },
          { id: 'password', label: 'New Password', value: password, onChange: setPassword },
          { id: 'confirmPassword', label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword },
        ].map(({ id, label, value, onChange }) => (
          <motion.div key={id} variants={itemVariants}>
            <label htmlFor={id} className="block font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              id={id}
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={label}
            />
          </motion.div>
        ))}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          variants={itemVariants}
          className={`w-full py-3 text-lg font-semibold rounded-lg text-white transition ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

export default Profile;
