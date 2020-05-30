import Scanner, { RemoteScanner, LocalScanner, LFTPScanner } from './scanner';
import LFTP from './lftp';

export default class Controller {
  context: object;
  // lftpJobs: Array<LFTPJob>;

  lftp: LFTP;

  localScanner: Scanner;

  remoteScanner: Scanner;

  constructor(context: object) {
    this.context = context;

    // Construct LFTP object
    this.lftp = new LFTP();

    // Initiate a scan process for each possible file "location" TODO paramaterize
    this.remoteScanner = new Scanner('/mnt/remote', true);
    this.localScanner = new Scanner(
      '/workspaces/untitled-lftp-project/test',
      false,
    );

    // Data Structure for  jobs
    // this.lftpJobs = [];

    this.bootstrap();
  }

  // Starts main controller logic post-constructing
  bootstrap() {
    // TODO log here
    console.log('Bootstrapping controller');

    this.remoteScanner.bootstrap((files: string[]) => console.log(files));
    this.localScanner.bootstrap((files: string[]) => console.log(files));

    // TODO Initiate extraction process
  }
}
