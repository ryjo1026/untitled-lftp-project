import Scanner from './scanner';
import LFTP from './lftp';
import logger from '../common/logger';

export default class Controller {
  // lftpJobs: Array<LFTPJob>;

  lftp: LFTP;

  localScanner: Scanner;

  remoteScanner: Scanner;

  constructor() {
    // Construct LFTP object
    this.lftp = new LFTP({
      hostname: 'cacus.feralhosting.com',
      user: 'ryjo1026',
      remoteHome: '/media/sdl1/ryjo1026',
      remoteDir: '/private/rtorrent/unraid',
      localDir: '/workspaces/untitled-lftp-project/test',
    });

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
    logger.info('Bootstrapping controller');

    this.remoteScanner.bootstrap((files: string[]) => console.log(files));
    this.localScanner.bootstrap((files: string[]) => console.log(files));
    this.lftp.bootstrap();

    // TODO Initiate extraction process
  }

  handleRemoteChange(files: string[]) {
    // Possible changes: A file has been changed, a file/dir has been added (disregard remove)
    // A directory has changed? Do we need to scan the entire directory structure? Not now just worry about transmitting top-level changes once
    // Check if we've transmitted the file before
    // Initiate an LFTP job
  }

  handleLocalChange(files: string[]) {
    // Possible changes: a file/dir has been added
    // Check if it was actually on the LFTP queue (Verify hash too)
    // Is this step unnecessary, can we find out progress of LFTP?
  }
}
