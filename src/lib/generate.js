import converter from 'express-jsdoc-swagger';
import YAML from 'json-to-pretty-yaml';
import { writeFileSync } from 'node:fs';
import {dirname, join} from 'node:path';
import app from '../app.js';
import {fileURLToPath} from "node:url";

const dirName = dirname(fileURLToPath(import.meta.url));

const options = {
  info: {
    title: 'WarframeStat.us API',
    description: 'Simple API for data from the game Warframe.',
    contact: {
      email: 'wf-com-dev@warframestat.us',
      name: 'Warframe Community Devs',
    },
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
    },
    version: 'living',
    'x-logo': {
      url: 'https://warframestat.us/wfcd_logo_color.png',
    },
  },
  externalDocs: {
    description: 'Find out more about Warframe',
    url: 'https://warframe.com',
  },
  servers: [
    {
      url: 'https://api.warframestat.us/',
      description: 'Preferred production server. Others may be disallowed in the future.',
    },
  ],
  filesPattern: './*.js',
  baseDir: join(dirName, '../controllers/'),
};

const listener = converter(app)(options);

listener.on('finish', (api) => {
  // const raw = JSON.stringify(api, null, 2);
  // fs.writeFileSync(path.join(__dirname, '../api-spec/openapi.json'), raw);
  writeFileSync(join(dirName, '../api-spec/openapi.yaml'), YAML.stringify(api));
  // eslint-disable-next-line no-console
  console.log('Wrote docs');
  process.exit(0);
});
