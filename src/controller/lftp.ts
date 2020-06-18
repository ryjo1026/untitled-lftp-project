import { spawn, ChildProcess, exec } from 'child_process';
import { Readable, Writable } from 'stream';

function validateStream(s: Readable | Writable | null) {
  // TODO throw here
  if (s === null) console.error(`${s}: Stream is null`);
}

export default class LFTP {
  child: ChildProcess;

  hostname: string;

  user: string;

  constructor(hostname: string, user: string) {
    this.hostname = hostname;
    this.user = user;

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
        stdio: ['pipe', 'pipe', process.stderr],
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
    this.child.stdout!.on('data', this.verifyLftpConnection);
  }

  verifyLftpConnection(s: string) {
    const lftpOut = s.toString();

    if (RegExp('Host key verification failed').test(lftpOut)) {
      // We need to add the ECDSA fingerprint to known hosts TODO test this
      console.log('Attempting to add ECDSA fingerprint to known_hosts');
      exec('ssh-keyscan -H cacus.feralhosting.com >> ~/.ssh/known_hosts');

      this.child.stdin!.write('ls\n');
      this.child.stdout!.on('data', this.verifyLftpConnection);
      return;
    }

    const lftpFileList = lftpOut.match(/(?!\s)(\S*)(?=\n)/g);
    let sshfsFileList: string[];

    const sshfsLs = spawn('ls', ['-va', '/mnt/remote']);
    sshfsLs.stdout.on('data', (data) => {
      const sshfsOut = data.toString();

      sshfsFileList = sshfsOut.match(/([^\s]+)/g);

      if (sshfsFileList.sort().toString() !== lftpFileList!.sort().toString()) {
        console.error('File structures desynced');
        process.exit(1);
      }
      console.log('Successful LFTP connection');
    });
  }
}
