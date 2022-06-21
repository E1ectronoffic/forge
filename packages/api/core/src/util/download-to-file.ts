import * as fs from 'fs-extra';
import * as got from 'got';
import * as path from 'path';
import ProgressBar from 'progress';

const PROGRESS_BAR_DELAY_IN_SECONDS = 30;

export async function downloadToFile(targetFilePath: string, url: string): Promise<void> {
  let downloadCompleted = false;
  let bar: ProgressBar | undefined;
  let progressPercent: number;
  await fs.mkdirp(path.dirname(targetFilePath));
  const writeStream = fs.createWriteStream(targetFilePath);

  const start = new Date();
  const timeout = setTimeout(() => {
    if (!downloadCompleted) {
      bar = new ProgressBar(`Downloading ${path.basename(url)}: [:bar] :percent ETA: :eta seconds `, {
        curr: progressPercent,
        total: 100,
      });
      // https://github.com/visionmedia/node-progress/issues/159
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (bar as any).start = start;
    }
  }, PROGRESS_BAR_DELAY_IN_SECONDS * 1000);

  await new Promise((resolve, reject) => {
    const downloadStream = got.stream({ method: 'GET', url });
    downloadStream.on('downloadProgress', async (progress) => {
      progressPercent = progress.percent;
      if (bar) {
        bar.update(progress.percent);
      }
    });
    downloadStream.on('error', (error) => {
      if (error.name === 'HTTPError' && error.statusCode === 404) {
        error.message += ` for ${error.url}`;
      }
      if (writeStream.destroy) {
        writeStream.destroy(error);
      }

      reject(error);
    });
    writeStream.on('error', (error) => reject(error));
    writeStream.on('close', () => resolve());

    downloadStream.pipe(writeStream);
  });

  downloadCompleted = true;
  if (timeout) {
    clearTimeout(timeout);
  }
}
