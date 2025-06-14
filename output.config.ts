import path from 'path';

export const outputConfig = {
  baseDir: path.resolve(process.cwd(), 'results'),
  subfolders: ['script', 'audio','final', 'images', 'video', 'subtitles'],
};