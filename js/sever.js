require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  // Verify reCAPTCHA
  try {
    const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${recaptchaToken}`);
    const { success } = response.data;

    if (!success) {
      return res.status(400).send('reCAPTCHA verification failed. Please try again.');
    }
  } catch (error) {
    return res.status(500).send('Error verifying reCAPTCHA. Please try again later.');
  }

  // Simulate user authentication
  if (username === 'user' && password === 'password') {
    res.send('Login successful!');
  } else {
    res.status(401).send('Invalid username or password.');
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});