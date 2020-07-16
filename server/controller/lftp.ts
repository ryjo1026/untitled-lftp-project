import { spawn, ChildProcess, exec, execSync } from 'child_process';
import { Readable, Writable } from 'stream';

function validateStream(s: Readable | Writable | null) {
  // TODO throw here
  if (s === null) console.error(`${s}: Stream is null`);
}

function verifyLftpConnection(s: string) {
  const lftpOut = s.toString();

  // Verify proper connection by comparing LFTP files with SSHFS files
  const lftpFileList = lftpOut.match(/(?!\s)(\S*)(?=\n)/g);
  let sshfsFileList: string[];

  const sshfsLs = spawn('ls', ['-va', '/mnt/remote']);
  sshfsLs.stdout.on('data', (data) => {
    const sshfsOut = data.toString();

    // TODO abstract SSHFS methods
    sshfsFileList = sshfsOut.match(/([^\s]+)/g);

    if (sshfsFileList.sort().toString() !== lftpFileList!.sort().toString()) {
      console.error(
        'File structures desynced',
        sshfsFileList.sort(),
        lftpFileList!.sort(),
      );
      process.exit(1);
    }
    console.log('Successful LFTP connection');
  });
}

function parseOutput(s: string) {
  console.log(s);
}

export default class LFTP {
  child: ChildProcess;

  hostname: string;

  user: string;

  remoteDir: string;

  localDir: string;

  constructor(
    hostname: string,
    user: string,
    remoteDir: string,
    localDir: string,
  ) {
    this.hostname = hostname;
    this.user = user;
    this.remoteDir = remoteDir;
    this.localDir = localDir;

    // Must use this connection type to avoid password prompts TODO catch errors
    this.child = spawn(
      'lftp',
      [
        '-u',
        `${this.user},xxx`,
        `sftp://${this.hostname}`,
        '-e',
        '\'set sftp:connect-program "ssh -a -x -i /workspaces/untitled-lftp-project/KEYS/cacus"\'',
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        detached: true,
      },
    );

    // unref() somehow disentangles the child's event loop from the parent's
    this.child.unref();
  }

  bootstrap() {
    console.log('bootstrapped lftp');

    validateStream(this.child.stdin);
    validateStream(this.child.stdout);
    const stdin: Writable = this.child.stdin!;

    stdin.write('ls\n');
    this.child.stderr!.on('data', this.parseConnectionError);
    this.child.stdout!.on('data', verifyLftpConnection);
  }

  parseConnectionError(s: string) {
    const lftpErr = s.toString();

    console.error(`Parsing error ${lftpErr}`);

    if (RegExp('Host key verification failed.').test(lftpErr)) {
      // We need to add the ECDSA fingerprint to known hosts TODO test this
      console.log('Attempting to add ECDSA fingerprint to known_hosts');
      execSync('ssh-keyscan -H cacus.feralhosting.com >> ~/.ssh/known_hosts');

      // Re-try verification
      this.child.stdin!.write('ls\n');
      this.child.stdout!.on('data', verifyLftpConnection);
    }

    // TODO other error conditions
  }

  runCommand(command: string) {
    // TODO shift check to decorator
    if (this.child === null) {
      console.error('LFTP crashed');
    }

    const stdin: Writable = this.child.stdin!;
    stdin.write(`${command}\n`);
    this.child.stderr!.on('data', this.parseConnectionError);
    this.child.stdout!.on('data', parseOutput);
  }

  queue(filename: string) {
    // TODO ensure directory / handle file
    this.runCommand(
      `queue mirror -c /mnt/remote${this.remoteDir}/${filename} ${this.localDir}`,
    );
  }
}
