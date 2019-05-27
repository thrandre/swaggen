import * as Fs from "fs";

export function removeDirectory(path: string) {
  if (Fs.existsSync(path)) {
    Fs.readdirSync(path).forEach(file => {
      var curPath = path + "/" + file;
      if (Fs.lstatSync(curPath).isDirectory()) {
        removeDirectory(curPath);
      } else {
        Fs.unlinkSync(curPath);
      }
    });
    Fs.rmdirSync(path);
  }
}

export function ensureDirectoryExists(path: string) {
  if (Fs.existsSync(path)) {
    return;
  }

  Fs.mkdirSync(path);
}

export function ensureDirectoriesExists(...paths: string[]) {
  const slicedPaths = paths.slice();
  slicedPaths.sort(
    (a, b) => (a.length === b.length ? 0 : b.length > a.length ? -1 : 1)
  );
  slicedPaths.forEach(p => ensureDirectoryExists(p));
}

export function writeFile(path: string, content: string) {
  Fs.writeFileSync(path, content);
}
