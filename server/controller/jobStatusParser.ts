import { Readable } from 'stream';
import readline from 'readline';
import moment from 'moment';
import filesizeParser = require('filesize-parser');
import logger from '../common/logger';

enum JobType {
  PGET,
  MIRROR,
}

interface TransferState {
  localSize: Number | null;
  remoteSize: Number | null;
  percent: Number | null;
  speed: string | null;
  eta: number | null;
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

interface MirrorMatchGroups {
  id: string;
  flags: string;
  remote: string;
  local: string;
  szremote: string;
  szlocal: string;
  speed: string;
  percent: string;
}

function hasPGetCaptureGroups(groups: any): groups is PGetMatchGroups {
  return (
    groups.id !== undefined &&
    groups.remote !== undefined &&
    groups.local !== undefined
  );
}

function hasMirrorCaptureGroups(groups: any): groups is MirrorMatchGroups {
  return (
    groups.id !== undefined &&
    groups.remote !== undefined &&
    groups.local !== undefined
  );
}

// RegEx patterns
const SIZE_UNITS_PATTERN =
  '(b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib)';

function sizeToBytes(s: string): number {
  logger.debug(`size ${s} is ${filesizeParser(s)} in bytes`);
  return filesizeParser(s);
}

function etaToSeconds(
  d: string,
  h: string,
  m: string,
  s: string,
): number | null {
  let isEmpty: boolean = true;

  const etaList = [d, h, m, s].map((t) => {
    if (t !== undefined) {
      isEmpty = false;
      return parseInt(t.replace(/[^\d.-]/g, ''), 10);
    }
    return 0;
  });

  // If everything was undefined we have a null eta (not a 0 eta)
  if (isEmpty) {
    return null;
  }

  return etaList[0] * 86400 + etaList[1] * 3600 + etaList[2] * 60 + etaList[3];
}

function calculateEta(
  localSize: number,
  remoteSize: number,
  s: string,
): number {
  // TODO
  const speed: string = s.match(RegExp(/.+?(?=\/s)/))![0];

  return Math.round(((remoteSize - localSize) * 8) / filesizeParser(speed));
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
    /^\s*\[(?<id>\d+)\]\s+mirror\s+(?<flags>.*?)\s+(?<remote>.+)\s+(?<local>\/.+)\s+--\s+(?<szlocal>\d+.?\d*s?((b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib)?))\/(?<szremote>\d+.?\d*\s?((b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib)?))\s+\((?<percent>\d+)%\)\s+(?<speed>\d+.?\d*\s?((b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib)?)\/s)?($|\n)/,
  );

  mirrorInitialHeaderPattern: RegExp = RegExp(
    /^\s*\[(?<id>\d+)\]\s+mirror\s+(?<flags>.*?)\s+(?<remote>.+)\s+(?<local>\/.+)/,
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
    const queueLines: Array<string> = [];

    // eslint-disable-next-line no-restricted-syntax
    for await (const line of readInterface) {
      if (RegExp(/^\s*\[\d+\]\s+queue/).test(line)) {
        isInQueueSection = true;
      }

      if (
        this.pgetHeaderPattern.test(line) ||
        this.mirrorHeaderPattern.test(line) ||
        this.mirrorInitialHeaderPattern.test(line)
      ) {
        logger.debug('Header found, sending to parsing');
        if (isInQueueSection) {
          this.parseQueue(queueLines);
          isInQueueSection = false;
        } else if (currentJob.type != null) {
          // If we aggregated a job parse it
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
      } else if (isInQueueSection) {
        // If we're in the queue aggregate to queueLines
        queueLines.push(line);
      } else {
        // Otherwise aggregate to currentJob
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
      const pgetJob = this.parsePGet(j.lines);
      if (pgetJob) return pgetJob;
    }
    if (j.type === JobType.MIRROR) {
      const mirrorJob = this.parseMirror(j.lines);
      if (mirrorJob) return mirrorJob;
    }

    throw new Error('Attempted to parse unparsable job');
  }

  // eslint-disable-next-line class-methods-use-this
  parseQueue(lines: Array<string>) {
    logger.debug(`Parsing queue lines: ${lines[0]}`);
  }

  // eslint-disable-next-line class-methods-use-this
  parsePGet(lines: Array<string>): LftpJob | null {
    logger.debug(`Parsing PGet: ${lines[0]}`);

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
        /^\s*`(?<name>.*)',\s+got\s(?<szlocal>\d+)\s+of\s+(?<szremote>\d+)\s+\((?<pct>\d+)%\)\s+(?<speed>\d+.?\d*\s?(b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib)\/s)?(\s+eta:(?<etaD>\d*d)?(?<etaH>\d*h)?(?<etaM>\d*m)?(?<etaS>\d*s)?)?/,
      ).exec(line);

      // If we found a dataline update transferState
      if (dataLine) {
        logger.debug('dataline: ', dataLine);

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

        const eta = etaToSeconds(etaD, etaH, etaM, etaS);

        job.transferState = {
          localSize: parseInt(szlocal, 10),
          remoteSize: parseInt(szremote, 10),
          percent: parseInt(pct, 10),
          speed,
          eta, // This should combine eta into a space-separated string ignoring any "undefineds"
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
    logger.debug(`Parsing Mirror: ${lines[0]}`);

    // TODO actually go into chunk data and individual files and offer as info in details

    const line: string = lines.shift()!;
    const match = this.mirrorHeaderPattern.exec(line);
    if (!match) {
      // TODO custom winston logging for fomatting error type into log
      logger.error(
        new Error(
          'parseMirror(): Expected Mirror Header as first line in Job output',
        ),
      );
    }
    if (hasMirrorCaptureGroups(match!.groups!)) {
      const {
        id,
        remote,
        flags,
        szlocal,
        szremote,
        percent,
        speed,
      } = match!.groups;

      const localSize = sizeToBytes(szlocal);
      const remoteSize = sizeToBytes(szremote);

      const job: LftpJob = {
        type: JobType.MIRROR,
        id: parseInt(id, 10),
        filename: remote,
        flags,
        transferState: {
          localSize,
          remoteSize,
          percent: parseInt(percent, 10),
          speed,
          eta: calculateEta(localSize, remoteSize, speed),
        },
        isRunning: true,
      };

      return job;
    }

    return null;
  }
}
