// Importing required modules
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('isomorphic-fetch');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000'], 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

// Middleware for parsing JSON
app.use(bodyParser.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hello, this is the root of the server!');
});

// AI Chatbot endpoint
app.use(cors(corsOptions));
app.options('/ai-chatbot', cors(corsOptions));
app.post('/ai-chatbot', async (req, res) => {
  // Log received request
  console.log('Received request:', req.body);
  const { prompt } = req.body;

  try {
    // Fetch response from OpenAI Chat API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.chatBotApi}`,
        'User-Agent': 'Chrome',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: "I'm a Student using ChatGPT for learning" },
          { role: 'user', content: prompt },
        ],
      }),
    });

    // Handle API response
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`OpenAI API error! Status: ${response.status} - ${response.statusText} - ${errorMessage}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    // Handle errors
    console.error('Error processing message:', error);
    if (error instanceof FetchError) {
      res.status(500).json({ error: 'Internal Server Error', details: 'Network error occurred while communicating with OpenAI API.' });
    } else if (error instanceof SyntaxError) {
      res.status(500).json({ error: 'Internal Server Error', details: 'Error parsing JSON response from OpenAI API.' });
    } else {
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
});

// Get API key endpoint
app.get('/get-api-key', (req, res) => {
  res.json({ apiKey: process.env.imageAnalyzerApi });
});

// Image Analyzer endpoint
app.use(cors(corsOptions));
app.options('/image-analyzer', cors(corsOptions));
app.post('/image-analyzer', async (req, res) => {``
  try {
    // Fetch API key
    const apiKeyResponse = await fetch('http://localhost:5000/get-api-key');
    const apiKeyData = await apiKeyResponse.json();

    console.log('Fetched API Key:', apiKeyData.apiKey);

    // Log received image data
    console.log('Received Body Data:', req.body);
    console.log('Received Other Data:', req.body.messages[0].content);

    if (!req.body || !req.body.messages || !req.body.messages[0].content) {
      throw new Error('Image data is undefined or null.');
    }

    // Fetch response from OpenAI Chat API for image analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${process.env.imageAnalyzerApi}`, 
        'User-Agent': 'Chrome',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `${req.body.messages[1].content[0].image_url.url}` },
              },
            ],
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What’s in this image?' },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error from OPENAI API:", data);
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }
    console.log('Image Analyzer API Response:', data);
    res.json(data);
  } catch (error) {
    // Handle errors
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Image Generation endpoint
app.post('/generate-image', async (req, res) => {
  console.log('Received request:', req.body);
  const { prompt } = req.body;

  try {
    // Fetch response from OpenAI Image Generation API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.imageGeneratorApi}`, 
        'User-Agent': 'Chrome',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    // Handle API response
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    // Handle errors
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
