import fswatch from 'fs';

/**
 * Scanner abstraction represents objects that continuously watch for filesystem changes or process progress for LFTP
 */
abstract class Scanner {
  abstract bootstrap(callback: Function): void;

  // TODO probably shared logging logic here
}

class RemoteScanner extends Scanner {
  bootstrap() {}
}

class LFTPScanner extends Scanner {
  bootstrap() {}
}

/**
 * LocalScanner starts an fswatch on the top-level directory and
 */
class LocalScanner extends Scanner {
  watchDir: string; // Path on local machine to watch for changes

  constructor(path: string) {
    super();

    this.watchDir = path;
    // TODO ensure is directory
  }

  /**
   *
   * @param callback a function that takes in a list representing all files scanned
   */
  bootstrap(callback: (f: string[]) => void) {
    fswatch.watch(this.watchDir, () => {
      fswatch.readdir(this.watchDir, (err, filenames) => {
        if (err) {
          // TODO proper logging
          return console.error('Error scanning ' + this.watchDir);
        }
        callback(filenames);
      });
    });
  }
}

export { RemoteScanner, LFTPScanner, LocalScanner };
