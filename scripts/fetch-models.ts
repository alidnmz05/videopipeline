import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import {runCli} from './lib/project';

// Downloads the 3D models used by the kira experiments from the three.js examples (r169).
// They are kept out of the repository because their redistribution terms are unclear;
// check their licences before using them in published videos.

const BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/r169/examples/models/gltf';
const MODELS = [
  {url: `${BASE}/readyplayer.me.glb`, out: 'public/models/rpm-avatar/avatar.glb'},
  {url: `${BASE}/Xbot.glb`, out: 'public/models/xbot/Xbot.glb'},
];

const download = (url: string, out: string) =>
  new Promise<void>((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`${url}: HTTP ${res.statusCode}`));
        fs.mkdirSync(path.dirname(out), {recursive: true});
        const file = fs.createWriteStream(out);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
      })
      .on('error', reject);
  });

runCli(async () => {
  for (const m of MODELS) {
    if (fs.existsSync(m.out)) {
      console.log(`exists  ${m.out}`);
      continue;
    }
    await download(m.url, m.out);
    console.log(`fetched ${m.out}`);
  }
});
