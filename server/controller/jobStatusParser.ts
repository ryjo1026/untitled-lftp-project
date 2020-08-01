import path from 'path';
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
  'b|B|k|kb|kib|K|Kb|KB|KiB|Kib|m|mb|mib|M|Mb|MB|MiB|Mib|g|gb|gib|G|Gb|GB|GiB|Gib';

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
  // eslint-disable-next-line class-methods-use-this
  parseJobs(output: string) {
    const jobs: Array<LftpJob> = [];

    // regexr.com/59f3v
    const pgetHeaderPattern = RegExp(
      /^\[(?<id>\d+)\]\s+pget\s+(?<flags>.*?)\s+(?<remote>.+)\s+-o\s+(?<local>.+)\s+--\s+(?<speed>.+)$/,
    );

    // Mirror header when downloading
    const mirrorHeaderPattern = RegExp(
      String.raw`^[(?P<id>d+)]s+mirrors+(?P<flags>.*?)s+(?P<lq>[\'"]|)(?P<remote>.+)(?P=lq)s+(?P<rq>[\'"]|)(?P<local>.+)(?P=rq)s+--s+(?P<szlocal>d+.?d*s?(${SIZE_UNITS_PATTERN})?)/(?P<szremote>d+.?d*s?(${SIZE_UNITS_PATTERN})?)s+((?P<pctlocal>d+)%)(s+(?P<speed>d+.?d*s?(${SIZE_UNITS_PATTERN}))/s)?$`,
    );

    // Mirror header when connection or getting the file list
    const mirrorInitialHeaderPattern = RegExp(
      /^\[(?P<id>\d+)\]\s+mirror\s+(?P<flags>.*?)\s+(?P<lq>['\"]|)(?P<remote>.+)(?P=lq)\s+(?P<rq>['\"]|)(?P<local>.+)(?P=rq)$/,
    );

    const filenamePattern = RegExp(
      String.raw`\\transfers${QUOTED_FILE_NAME_PATTERN}`,
    );

    const chunkAtPattern = RegExp(
      String.raw`^${QUOTED_FILE_NAME_PATTERN}\s+at\s+\d+\s+(?:\(\d+%\)\s+)?((?P<speed>\d+\.?\d*\s?(${SIZE_UNITS_PATTERN}))\/s\s+)?(eta:(?P<eta>${TIME_UNITS_PATTERN})\s+)?\s*\[(?P<desc>.*)\]$`,
    );

    const chunkAt2Pattern = RegExp(
      String.raw`^${QUOTED_FILE_NAME_PATTERN}\s+at\s+\d+\s+(?:\(\d+%\))`,
    );

    const chunkGotPattern = RegExp(
      String.raw`^${QUOTED_FILE_NAME_PATTERN},\s+got\s+(?P<localSize>\d+)\s+of\s+(?P<remoteSize>\d+)\s+\((?P<percent>\d+)%\)(\s+(?P<speed>\d+\.?\d*\s?(${SIZE_UNITS_PATTERN}))\/s)?(\seta:(?P<eta>${TIME_UNITS_PATTERN}))?`,
    );

    const lines: Array<string> = output.split(/\r\n|\r|\n/);

    let prevJob: LftpJob | null = null;
    while (lines.length !== 0) {
      // Pop the first element
      const line = lines.shift();
      if (line === undefined) {
        console.error('Error reading lines');
        return;
      }

      // First line has to be a valid job header
      if (
        pgetHeaderPattern.test(line) ||
        mirrorHeaderPattern.test(line) ||
        mirrorInitialHeaderPattern.test(line)
      ) {
        console.error(`Invalid first line job output: ${line}`);
        return;
      }

      // Look for pgets
      const pgetMatch = pgetHeaderPattern.exec(line);
      const mirrorInitialHeaderMatch = mirrorInitialHeaderPattern.exec(line);
      if (pgetMatch) {
        //  Next line must be sftp
        if (lines.length < 1 || !RegExp('sftp').test(lines[0])) {
          console.error(`SFTP not found after pget header: ${line}`);
          return;
        }
        // Now we pop the sftp line
        lines.shift();

        let chunkAtMatch: null | RegExpExecArray = null;
        let chunkAt2Match: null | RegExpExecArray = null;
        let chunkGotMatch: null | RegExpExecArray = null;
        if (lines.length > 0) {
          // Pop off the data line
          const dataLine = lines.shift();
          if (dataLine === undefined) {
            logger.error("Couldn't get sftp data line");
            return;
          }

          // .exec() returns null if no match
          chunkAtMatch = chunkAt2Pattern.exec(dataLine);
          chunkAt2Match = chunkAt2Pattern.exec(dataLine);
          chunkGotMatch = chunkGotPattern.exec(dataLine);
        }

        const { flags, id, remote, local } = pgetMatch.groups!;
        const filename = path.basename(remote);

        const status: LftpJob = {
          id: parseInt(id, 10),
          type: JobType.PGET,
          transferState: null,
          flags,
          filename,
          isRunning: true,
        };

        if (chunkAtMatch) {
          if (remote !== chunkAtMatch.groups!.name) {
            logger.error(
              new Error(
                `Mismatching PGET names local:${
                  chunkAtMatch.groups!.name
                } remote:${remote}`,
              ),
            );
          }

          const { speed, eta } = chunkAtMatch.groups!;

          status.transferState = {
            speed: sizeToBytes(speed),
            eta: timeToSeconds(eta),
            remoteSize: null,
            localSize: null,
            percent: null,
          };
        } else if (chunkAt2Match) {
          if (remote !== chunkAt2Match.groups!.name) {
            logger.error(
              new Error(
                `Mismatching PGET names local:${
                  chunkAt2Match.groups!.name
                } remote:${remote}`,
              ),
            );
          }

          status.transferState = {
            speed: null,
            eta: null,
            remoteSize: null,
            localSize: null,
            percent: null,
          };
        } else if (chunkGotMatch) {
          const gotGroupBasename = path.basename(chunkGotMatch.groups!.name);
          if (gotGroupBasename !== filename) {
            logger.error(
              new Error(
                `Mismatching chunk data chunk:${gotGroupBasename} filename:${filename}`,
              ),
            );
          }

          const {
            localSize,
            remoteSize,
            percent,
            speed,
            eta,
          } = chunkGotMatch.groups!;

          status.transferState = {
            localSize: parseInt(localSize, 10),
            remoteSize: parseInt(remoteSize, 10),
            percent: parseInt(percent, 10),
            speed: sizeToBytes(speed),
            eta: timeToSeconds(eta),
          };
        } else {
          // No data line
          status.transferState = {
            speed: null,
            eta: null,
            remoteSize: null,
            localSize: null,
            percent: null,
          };
        }

        jobs.push(status);
        prevJob = status;
      } else if (mirrorInitialHeaderMatch) {
        // Priority after pgetMatch on purpose
      }
    }
  }
}
