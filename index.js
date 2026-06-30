const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('السيرفر يعمل الآن بنجاح!');
});

app.listen(port, () => {
  console.log(`السيرفر يعمل على المنفذ ${port}`);
});