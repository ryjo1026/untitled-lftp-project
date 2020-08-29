import { describe, it } from 'mocha';
import * as assert from 'assert';
import fs from 'fs';

import JobStatusParser from '../server/controller/jobStatusParser';

describe('JobStatusParser', () => {
  describe('#parseJobs()', () => {
    it('should parse basic pget', (done) => {
      const parser = new JobStatusParser();

      parser
        .parseJobs(
          fs.createReadStream(
            '/workspaces/untitled-lftp-project/test/data/simple-pget.txt',
          ),
        )
        .then((jobs) => {
          const expected = [
            {
              type: 0,
              id: 1,
              filename:
                'Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv',
              flags: '-c',
              transferState: {
                localSize: 9681635592,
                remoteSize: 12053998409,
                percent: 80,
                speed: '3.52M/s',
                eta: '19m',
              },
              isRunning: true,
            },
          ];

          assert.deepStrictEqual(jobs, expected);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it('should parse basic pget with a queue', (done) => {
      const parser = new JobStatusParser();

      parser
        .parseJobs(
          fs.createReadStream(
            '/workspaces/untitled-lftp-project/test/data/simple-pget-with-queue.txt',
          ),
        )
        .then((jobs) => {
          const expected = [
            {
              type: 0,
              id: 1,
              filename:
                'Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv',
              flags: '-c',
              transferState: {
                localSize: 9681635592,
                remoteSize: 12053998409,
                percent: 80,
                speed: '3.52M/s',
                eta: '19m',
              },
              isRunning: true,
            },
          ];

          assert.deepStrictEqual(jobs, expected);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it('should parse multiple pgets with a queue', (done) => {
      const parser = new JobStatusParser();

      parser
        .parseJobs(
          fs.createReadStream(
            '/workspaces/untitled-lftp-project/test/data/multiple-pget.txt',
          ),
        )
        .then((jobs) => {
          const expected = [
            {
              type: 0,
              id: 1,
              filename:
                'Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv',
              flags: '-c',
              transferState: {
                localSize: 1709506560,
                remoteSize: 12053998409,
                percent: 14,
                speed: '2.33M/s',
                eta: '82m',
              },
              isRunning: true,
            },
            {
              type: 0,
              id: 2,
              filename: 'normal.people.s01e01.multi.1080p.web.h264-cielos.r00',
              flags: '-c',
              transferState: {
                localSize: 27951104,
                remoteSize: 100000000,
                percent: 27,
                speed: '891.4K/s',
                eta: '8m',
              },
              isRunning: true,
            },
            {
              type: 0,
              id: 3,
              filename: 'normal.people.s01e01.multi.1080p.web.h264-cielos.r01',
              flags: '-c',
              transferState: {
                localSize: 23035904,
                remoteSize: 100000000,
                percent: 23,
                speed: '1.07M/s',
                eta: '6m',
              },
              isRunning: true,
            },
            {
              type: 0,
              id: 4,
              filename: 'normal.people.s01e01.multi.1080p.web.h264-cielos.r03',
              flags: '-c',
              transferState: {
                localSize: 327680,
                remoteSize: 100000000,
                percent: 0,
                speed: '158.9K/s',
                eta: '',
              },
              isRunning: true,
            },
          ];

          assert.deepStrictEqual(jobs, expected);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});

// TODO test mirror fl pattern (no examples yet)
