import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../../plugins/inttegro/assets/logo.png', import.meta.url));
const destination = fileURLToPath(new URL('../assets/icon.png', import.meta.url));

mkdirSync(fileURLToPath(new URL('../assets/', import.meta.url)), { recursive: true });
copyFileSync(source, destination);
