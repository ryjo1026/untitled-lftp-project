import { describe, it } from 'mocha';
import * as assert from 'assert';
import fs from 'fs';

import JobStatusParser from '../server/controller/jobStatusParser';

describe('JobStatusParser', () => {
  describe('#parseJobs()', () => {
    it('should parse basic pget', () => {
      const parser = new JobStatusParser();

      const res = parser.parseJobs(
        fs.createReadStream(
          '/workspaces/untitled-lftp-project/test/data/simple-pget-job.txt',
        ),
      );
      console.log(res);

      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

// TODO test mirror fl pattern (no examples yet)
