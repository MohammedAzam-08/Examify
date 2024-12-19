const jwt = require('jsonwebtoken');

const secretKey = 'your-secret-key-here';

const payload = {
  _id: '12345',
  name: 'John Doe',
  email: 'john.doe@example.com',
};

const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

console.log(token);