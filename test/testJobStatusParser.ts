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
            '/workspaces/untitled-lftp-project/test/data/simple-pget-job.txt',
          ),
        )
        .then((jobs) => {
          console.log(jobs);

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
  });
});

// TODO test mirror fl pattern (no examples yet)
