import { type Application } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export default function initializeRoutes(app: Application): void {
  const routesPath: string = './src/routes';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  console.log(__dirname);

  fs.readdirSync(routesPath).forEach(async (file: string) => {
    try {
      if (file !== 'index.ts' && path.extname(file) === '.ts') {
        const { default: router } = await import(`./${file}`);

        const p = path.relative(
          __dirname,
          path.join(routesPath, file.replace('.ts', '')),
        );

        app.use(`/${p}`, router);
      }
    } catch (e) {
      console.log(e);
    }
  });
}
