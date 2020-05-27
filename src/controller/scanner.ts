abstract class Scanner {
  abstract bootstrap(): void;
}

class RemoteScanner extends Scanner {
  bootstrap() {}
}

class LFTPScanner extends Scanner {
  bootstrap() {}
}

class LocalScanner extends Scanner {
  bootstrap() {}
}

export { RemoteScanner, LFTPScanner, LocalScanner };
