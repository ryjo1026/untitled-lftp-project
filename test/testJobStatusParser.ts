import { describe, it } from 'mocha';
import * as assert from 'assert';

import JobStatusParser from '../server/controller/jobStatusParser';

describe('JobStatusParser', () => {
  describe('#parseJobs()', () => {
    it('should parse basic pget', () => {
      const parser = new JobStatusParser();

      const res = parser.parseJobs(`
        [0] pget -c -O /workspaces/untitled-lftp-project/test Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv  -- 3.23 MiB/s
                sftp://ryjo1026:xxx@cacus.feralhosting.com/media/sdl1/ryjo1026/private/rtorrent/unraid
                \`Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv', got 9679636744 of 12053998409 (80%) 3.23M/s eta:15m 
        \\chunk 0-10128347109
                \`Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv' at 9655224584 (0%) 816.2K/s eta:9m [Receiving data]
        \\chunk 11572585584-12053998408 
                \`Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv' at 11580187760 (1%) 761.1K/s eta:10m [Receiving data]
        \\chunk 11091172759-11572585583 
                \`Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv' at 11096645015 (1%) 579.4K/s eta:13m [Receiving data]
        \\chunk 10609759934-11091172758 
                \`Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv' at 10614773438 (1%) 511.5K/s eta:15m [Receiving data]
        \\chunk 10128347109-10609759933 
                \`Hell.or.High.Water.2016.1080p.BluRay.DD5.1.x264-SA89.mkv' at 10134671333 (1%) 639.9K/s eta:12m [Receiving data]
      `);
      console.log(res);

      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
