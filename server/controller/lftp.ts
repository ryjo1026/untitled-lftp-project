import { spawn, execSync, ChildProcess } from 'child_process';
import * as fs from 'fs';
import { Readable, Writable } from 'stream';
import LftpJobStatusParser from './jobStatusParser';

// A config paramater object
interface Config {
  hostname: string;
  user: string;
  remoteHome: string;
  // remoteDir is in comparison to root dir of remote machine (not including /mnt/remote)
  remoteDir: string;
  localDir: string;
}

function validateStream(s: Readable | Writable | null) {
  // TODO throw here
  if (s === null) console.error(`${s}: Stream is null`);
}

function parseOutput(s: string) {
  console.log(s);
}

export default class LFTP {
  child: ChildProcess;

  config: Config;

  statusParser: LftpJobStatusParser;

  constructor(config: Config) {
    this.config = config;

    // initialize a parser object for statuses
    this.statusParser = new LftpJobStatusParser();

    // Must use this connection type to avoid password prompts TODO catch more errors
    this.child = spawn(
      'lftp',
      [
        '-u',
        `${this.config.user},xxx`,
        `sftp://${this.config.hostname}`,
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
    this.child.stdout!.on('data', this.verifyLftpConnection);

    //TODO fix flow here, should await verifaction then allow commands
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
      this.child.stdout!.on('data', this.verifyLftpConnection);
    }

    // TODO other error conditions
    // Parsing error mirror: Access failed: No such file
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

  /**
   * Queues a job for downloading
   * @param filename name of the remote file to download (assumes it's in the remote directory)
   */
  queue(filename: string) {
    // TODO needs path escaping?
    console.log(`queueing ${filename}`);

    const remoteFile: string = `${this.config.remoteHome}/${this.config.remoteDir}/${filename}`;

    let isFileDirectory: boolean;
    try {
      isFileDirectory = fs
        .lstatSync(`/mnt/remote/${this.config.remoteDir}/${filename}`)
        .isDirectory();
    } catch (error) {
      console.error(`Couldn't find ${remoteFile}: check that it exists`);
      return;
    }

    this.runCommand(
      `queue ${isFileDirectory ? 'mirror' : 'pget'} -c -O ${
        this.config.localDir
      } ${remoteFile} `,
    );
  }

  status() {
    this.child.stdin!.write('jobs -v\n');
    this.child.stdout?.on('data', this.statusParser.parseJobs);
  }

  verifyLftpConnection(s: string) {
    const lftpOut = s.toString();

    // Verify proper connection by comparing LFTP files with SSHFS files
    const lftpFileList = lftpOut.match(/(?!\s)(\S*)(?=\n)/g);
    let sshfsFileList: string[];

    const sshfsLs = spawn('ls', ['-va', '/mnt/remote']);
    sshfsLs.stdout.on('data', (data) =>
      this.verifyLftpSynced(data, lftpFileList),
    );
  }

  verifyLftpSynced(data: any, lftpFileList: any) {
    const sshfsOut = data.toString();

    // TODO abstract SSHFS methods
    let sshfsFileList = sshfsOut.match(/([^\s]+)/g);

    if (sshfsFileList.sort().toString() !== lftpFileList!.sort().toString()) {
      console.error(
        'File structures desynced',
        sshfsFileList.sort(),
        lftpFileList!.sort(),
      );
      process.exit(1);
    }
    console.log('Successful LFTP connection');

    //FIXME Test fixture
    this.queue('The.Mandalorian.S01E02.INTERNAL.1080p.HEVC.x265-MeGusta');
  }
}
