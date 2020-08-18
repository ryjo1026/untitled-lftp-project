import { Readable } from 'stream';
import readline from 'readline';
import logger from '../common/logger';
import { resolve } from 'path';

enum JobType {
  PGET,
  MIRROR,
}

interface TransferState {
  localSize: Number | null;
  remoteSize: Number | null;
  percent: Number | null;
  speed: string | null;
  eta: string | null;
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

// Types for ensuring all capture groups present in Regexp.exec()s
interface PGetMatchGroups {
  id: string;
  flags: string;
  remote: string;
  local: string;
  speed: string;
}

function hasPGetCaptureGroups(groups: any): groups is PGetMatchGroups {
  return (
    groups.id !== undefined &&
    groups.remote !== undefined &&
    groups.local !== undefined
  );
}

// RegEx patterns
const SIZE_UNITS_PATTERN =
  '(b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib)';

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
    /^\s*\[(?<id>\d+)\]\s+pget\s+(?<flags>.*?)\s+(?<remote>.+)\s+-o\s+(?<local>.+)\s+--\s+(?<speed>.+)($|\n)/,
  );

  // mirror header downloading: regexr.com/5a68a
  mirrorHeaderPattern: RegExp = RegExp(
    String.raw`^\s*\[(?<id>\d+)\]\s+mirror\s+(?<flags>.*?)\s+(?<remote>.+)\s+(?<local>\/.+)\s+--\s+(?<szlocal>\d+.?\d*s?(${SIZE_UNITS_PATTERN}?))\/(?<szremote>\d+.?\d*\s?(${SIZE_UNITS_PATTERN}?))\s+\((?<pct>\d+)%\)\s+(?<speed>\d+.?\d*\s?(${SIZE_UNITS_PATTERN}?)\/s)?/`,
  );

  mirrorInitialHeaderPattern: RegExp = RegExp(
    /^\[(?<id>\d+)\]\s+mirror\s+(?<flags>.*?)\s+(?<remote>.+)\s+(?<local>\/.+)/,
  );

  // parseJobs takes in a Readable stream which can be used with files and stout interchangeably
  // eslint-disable-next-line class-methods-use-this
  async parseJobs(output: Readable) {
    const jobs: Array<LftpJob> = [];

    // Create a readlines interface to iterate the stream
    const readInterface = readline.createInterface({
      input: output,
    });

    let currentJob: LftpJobRaw = {
      type: null,
      lines: [],
    };
    let isInQueueSection: boolean = false;
    // eslint-disable-next-line no-restricted-syntax
    for await (const line of readInterface) {
      // If there's queue info at the begining, ignore all info until the next header
      if (RegExp(/\[\d+\]\s+queue\s+/).test(line)) {
        isInQueueSection = true;
      }

      if (
        this.pgetHeaderPattern.test(line) ||
        this.mirrorHeaderPattern.test(line) ||
        this.mirrorInitialHeaderPattern.test(line)
      ) {
        logger.debug('Header found, sending to parsing');
        // If we encounter a header, send off the previous job for parsing and start a new one
        // If there are no lines then we must be at the beginning of the parse
        if (currentJob.lines.length > 0) {
          const parsedJob = this.sendJobToParser(currentJob);
          if (parsedJob) jobs.push(parsedJob);
        }

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

        isInQueueSection = false;
      } else if (!isInQueueSection) {
        // Otherwise aggregate
        currentJob.lines.push(line);
      }
    }

    // Send off the last job and return
    const parsedJob = this.sendJobToParser(currentJob);
    if (parsedJob) jobs.push(parsedJob);
    return jobs;
  }

  /**
   * Sends jobs to appropriate parse function
   */
  sendJobToParser(j: LftpJobRaw): LftpJob {
    if (j.type === JobType.PGET) {
      return this.parsePGet(j.lines);
    }
    if (j.type === JobType.MIRROR) {
      return this.parseMirror(j.lines);
    }

    throw new Error('Attempted to parse undefined JobType');
  }

  // eslint-disable-next-line class-methods-use-this
  parsePGet(lines: Array<string>): LftpJob | null {
    logger.debug(`Parsing PGet: ${lines}`);

    let line: string = lines.shift()!;
    const match = this.pgetHeaderPattern.exec(line);
    if (!match) {
      // TODO custom winston logging for fomatting error type into log
      logger.error(
        new Error(
          'parsePGet(): Expected PGet Header as first line in Job output',
        ),
      );
    }
    if (hasPGetCaptureGroups(match!.groups!)) {
      // Advance to the next line (Should be sftp://... line)
      line = lines.shift()!;
      if (!line || !RegExp(/sftp:/).test(line)) {
        logger.error(
          new Error("parsePGet(): couldn't find sftp line after header"),
        );
      }

      const { id, remote, flags } = match!.groups;

      const job: LftpJob = {
        type: JobType.PGET,
        id: parseInt(id, 10),
        filename: remote,
        flags,
        transferState: null,
        isRunning: true,
      };

      // TODO actually go into chunk data and offer as info in details
      line = lines.shift()!;
      const dataLine = RegExp(
        /`(?<name>.*)',\s+got\s(?<szlocal>\d+)\s+of\s+(?<szremote>\d+)\s+\((?<pct>\d+)%\)\s+(?<speed>\d+.?\d*\s?(b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib)\/s)?(\s+eta:(?<etaD>\d*d)?(?<etaH>\d*h)?(?<etaM>\d*m)?(?<etaS>\d*s)?)?/,
      ).exec(line);

      // If we found a dataline update transferState
      if (dataLine) {
        const {
          name,
          szlocal,
          szremote,
          pct,
          speed,
          etaH,
          etaD,
          etaM,
          etaS,
        } = dataLine.groups!;

        if (name !== remote) {
          logger.error(
            new Error(
              "parsePGet(): header and data line filenames don't match",
            ),
          );
        }

        job.transferState = {
          localSize: parseInt(szlocal, 10),
          remoteSize: parseInt(szremote, 10),
          percent: parseInt(pct, 10),
          speed,
          eta: [etaD, etaH, etaM, etaS].join(''), // This should combine eta into a space-separated string ignoring any "undefineds"
        };
      }
      return job;
    }
    logger.error(
      new Error(
        "parsePGet(): PGet Header doesn't have all required capture groups",
      ),
    );
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  parseMirror(lines: Array<string>): LftpJob | null {
    logger.debug(`Parsing Mirror: ${lines}`);
    return null;
  }
}
