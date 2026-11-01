import { createApp } from './app.ts';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`🚀 Blue Archive Logo API is running at http://localhost:${port}`);
  console.log(`📌 Compatibility endpoint: http://localhost:${port}/balogo`);
  console.log(`📌 RESTful endpoint:     http://localhost:${port}/api/logo`);
});
