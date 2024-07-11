require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();

const clientKey = process.env.CLIENT_KEY;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
const tiktokUniqueId = process.env.TIKTOK_UNIQUE_ID;

console.log('CLIENT_KEY:', clientKey);
console.log('CLIENT_SECRET:', clientSecret);
console.log('REDIRECT_URI:', redirectUri);
console.log('TIKTOK_UNIQUE_ID:', tiktokUniqueId);

if (!tiktokUniqueId) {
  console.error("TIKTOK_UNIQUE_ID is not set in the .env file");
  process.exit(1);
}

const tiktokConnection = new WebcastPushConnection(tiktokUniqueId);

app.get('/', (req, res) => {
  res.send('Serverul este funcțional. Accesează /auth/tiktok pentru autentificare TikTok.');
});

app.get('/auth/tiktok', (req, res) => {
  const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${redirectUri}`;
  console.log('Redirecting to TikTok auth URL:', authUrl);
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const authCode = req.query.code;
  console.log('Received auth code:', authCode);

  if (!authCode) {
    console.error('No auth code received');
    return res.status(400).send('No auth code received');
  }

  try {
    const tokenResponse = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
      client_key: clientKey,
      client_secret: clientSecret,
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const accessToken = tokenResponse.data.data.access_token;
    console.log('Received access token:', accessToken);
    res.json({ accessToken });
  } catch (error) {
    console.error('Error during token exchange:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
