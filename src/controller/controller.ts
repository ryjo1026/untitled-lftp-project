import { RemoteScanner, LocalScanner, LFTPScanner } from './scanner';
import LFTP from './lftp';

export default class Controller {
  context: object;
  // lftpJobs: Array<LFTPJob>;

  lftp: LFTP;

  remoteScanner: RemoteScanner;
  localScanner: LocalScanner;
  lftpScanner: LFTPScanner;

  constructor(context: object) {
    this.context = context;

    // Construct LFTP object
    this.lftp = new LFTP();

    // Initiate a scan process for each possible file "location"
    this.remoteScanner = new RemoteScanner();
    this.localScanner = new LocalScanner(
      '/Users/ryanjohnston/Development/untitled-lftp-project/test'
    );
    this.lftpScanner = new LFTPScanner();

    // Data Structure for  jobs
    // this.lftpJobs = [];

    this.bootstrap();
  }

  // Starts main controller logic post-constructing
  bootstrap() {
    // TODO log here
    console.log('Bootstrapping controller');

    this.remoteScanner.bootstrap();
    this.localScanner.bootstrap((files: string[]) => console.log(files));
    this.lftpScanner.bootstrap();

    // TODO Initiate extraction process
  }
}
