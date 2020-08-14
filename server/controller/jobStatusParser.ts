import path from 'path';
import { Readable } from 'stream';
import readline from 'readline';
import logger from '../common/logger';

enum JobType {
  PGET,
  MIRROR,
}

interface TransferState {
  localSize: Number | null;
  remoteSize: Number | null;
  percent: Number | null;
  speed: Number | null;
  eta: Number | null;
}

// Represents job as raw string output
interface LftpJobRaw {
  lines: Array<string>;
  type: JobType | null;
}

// Parsed from string output as a group
interface LftpJob {
  id: Number;
  type: JobType;
  filename: string;
  flags: string;
  transferState: TransferState | null;
  isRunning: boolean;
}

// RegEx patterns
const SIZE_UNITS_PATTERN =
  '(b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib)';

const TIME_UNITS_PATTERN =
  '(?P<eta_d>d*d)?(?P<eta_h>d*h)?(?P<eta_m>d*m)?(?P<eta_s>d*s)?';

const QUOTED_FILE_NAME_PATTERN = "`(?P<name>.*)'";

const QUEUE_DONE_PATTERN = '^[(?P<id>d+)]sDones(queues(.+))';

function sizeToBytes(s: string): Number {
  // TODO
  return parseInt(s, 10);
}

function timeToSeconds(t: string): Number {
  // TODO
  return parseInt(t, 10);
}

/**
 * Handles parsing of "jobs -v" output from LFTP borrows heavily from (https://github.com/ipsingh06/seedsync)
 */
export default class LftpJobStatusParser {
  // pget header: regexr.com/59f3v
  pgetHeaderPattern: RegExp = RegExp(
    /^\[(?<id>\d+)\]\s+pget\s+(?<flags>.*?)\s+(?<remote>.+)\s+-O\s+(?<local>.+)\s+--\s+(?<speed>.+)($|\n)/,
  );

  // mirror header downloading: regexr.com/5a68a
  mirrorHeaderPattern: RegExp = RegExp(
    String.raw`^\[(?<id>\d+)\]\s+mirror\s+(?<flags>.*?)\s+(?<remote>.+)\s+(?<local>\/.+)\s+--\s+(?<szlocal>\d+.?\d*s?(${SIZE_UNITS_PATTERN}?))\/(?<szremote>\d+.?\d*\s?(${SIZE_UNITS_PATTERN}?))\s+\((?<pct>\d+)%\)\s+(?<speed>\d+.?\d*\s?(${SIZE_UNITS_PATTERN}?)\/s)?$/`,
  );

  mirrorInitialHeaderPattern: RegExp = RegExp(
    /^\[(?<id>\d+)\]\s+mirror\s+(?<flags>.*?)\s+(?<remote>.+)\s+(?<local>\/.+)$/,
  );

  // parseJobs takes in a Readable stream which can be used with files and stout interchangeably
  // eslint-disable-next-line class-methods-use-this
  parseJobs(output: Readable) {
    const jobs: Array<LftpJob> = [];

    // // Mirror header when connection or getting the file list
    // const mirrorInitialHeaderPattern = RegExp(
    //   /^\[(?P<id>\d+)\]\s+mirror\s+(?P<flags>.*?)\s+(?P<lq>['\"]|)(?P<remote>.+)(?P=lq)\s+(?P<rq>['\"]|)(?P<local>.+)(?P=rq)$/,
    // );

    // const filenamePattern = RegExp(
    //   String.raw`\\transfers${QUOTED_FILE_NAME_PATTERN}`,
    // );

    // const chunkAtPattern = RegExp(
    //   String.raw`^${QUOTED_FILE_NAME_PATTERN}\s+at\s+\d+\s+(?:\(\d+%\)\s+)?((?P<speed>\d+\.?\d*\s?(${SIZE_UNITS_PATTERN}))\/s\s+)?(eta:(?P<eta>${TIME_UNITS_PATTERN})\s+)?\s*\[(?P<desc>.*)\]$`,
    // );

    // const chunkAt2Pattern = RegExp(
    //   String.raw`^${QUOTED_FILE_NAME_PATTERN}\s+at\s+\d+\s+(?:\(\d+%\))`,
    // );

    // const chunkGotPattern = RegExp(
    //   String.raw`^${QUOTED_FILE_NAME_PATTERN},\s+got\s+(?P<localSize>\d+)\s+of\s+(?P<remoteSize>\d+)\s+\((?P<percent>\d+)%\)(\s+(?P<speed>\d+\.?\d*\s?(${SIZE_UNITS_PATTERN}))\/s)?(\seta:(?P<eta>${TIME_UNITS_PATTERN}))?`,
    // );

    // Create a readlines interface to iterate the stream
    const readInterface = readline.createInterface({
      input: output,
    });

    let currentJob: LftpJobRaw = {
      type: null,
      lines: [],
    };
    readInterface
      .on('line', (line) => {
        // logger.debug(`Parsing line: ${line}`);

        if (
          this.pgetHeaderPattern.test(line) ||
          this.mirrorHeaderPattern.test(line) ||
          this.mirrorInitialHeaderPattern.test(line)
        ) {
          logger.debug('Header found, sending to parsing');
          // If we encounter a header, send off the previous job for parsing and start a new one
          const parsedJob = this.sendJobToParser(currentJob);
          if (parsedJob) jobs.push(parsedJob);

          // Initialize new job with type
          let type = null;
          if (this.pgetHeaderPattern.test(line)) {
            type = JobType.PGET;
          } else {
            type = JobType.MIRROR;
          }
          currentJob = {
            type,
            lines: [line],
          };
        } else {
          // Otherwise aggregate
          currentJob.lines.push(line);
        }
      })
      .on('close', () => {
        // Send out the last job for parsing
        const parsedJob = this.sendJobToParser(currentJob);
        if (parsedJob) jobs.push(parsedJob);
      });
  }

  /**
   * Sends jobs to appropriate parse function
   */
  sendJobToParser(j: LftpJobRaw): LftpJob | null {
    // Reading the first line triggers a null job; ignore it
    if (j.type === null) {
      return null;
    }

    if (j.type === JobType.PGET) {
      return this.parsePGet(j.lines);
    }
    if (j.type === JobType.MIRROR) {
      return this.parseMirror(j.lines);
    }

    throw new Error('Attempted to parse undefined JobType');
  }

  // eslint-disable-next-line class-methods-use-this
  parsePGet(lines: Array<string>): LftpJob {
    logger.debug(`Parsing PGet: ${lines}`);
  }

  // eslint-disable-next-line class-methods-use-this
  parseMirror(lines: Array<string>): LftpJob {
    logger.debug(`Parsing Mirror: ${lines}`);
  }
}
