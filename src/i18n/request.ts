import { getRequestConfig } from 'next-intl/server';
import fs from 'fs/promises';
import path from 'path';

export default getRequestConfig(async () => {
  // Load default Spanish messages
  const filePath = path.join(process.cwd(), '../auren-shared/translations/common/es.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const messages = JSON.parse(fileContents);

  return {
    locale: 'es',
    messages
  };
});
