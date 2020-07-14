import fswatch from 'fs';
import * as chokidar from 'chokidar';

/**
 * Scanner watches a remote or local filesystem for changes.
 */
class Scanner {
  watchDir: string; // Path on machine to watch for changes

  isRemote: boolean; // Are we scanning a remote directory?

  constructor(watchDir: string, isRemote: boolean) {
    this.watchDir = watchDir;
    this.isRemote = isRemote;
    // TODO ensure is directory
  }

  /**
   * Create a watcher on the directory
   * @param callback a function that takes in a list representing all files scanned
   */
  bootstrap(callback: (f: string[]) => void) {
    chokidar
      .watch(this.watchDir, {
        usePolling: this.isRemote,
        depth: 1,
      })
      .on('ready', () => {
        console.log('Watching', this.watchDir);

        // Fallback to polling only if remote
        chokidar
          .watch(this.watchDir, {
            usePolling: this.isRemote,
            depth: 1,
            ignoreInitial: true,
          })
          .on('all', (event, path) => {
            console.log(`Heard ${event} on ${path}`);
            fswatch.readdir(this.watchDir, (err, filenames) => {
              if (err) {
                // TODO proper logging
                return console.error(`Error scanning ${this.watchDir}`);
              }
              return callback(filenames);
            });
          });
      });
  }
}

export default Scanner;
