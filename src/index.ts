import { createApp } from './app';

const PORT = Number(process.env.PORT) || 3001;
const DATA_FILE = process.env.DATA_FILE || './tasks.json';

const app = createApp({ dataFile: DATA_FILE });

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Tasks API listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Try: curl http://localhost:${PORT}/api/tasks`);
});
