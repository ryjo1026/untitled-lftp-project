import React from 'react';
import styled from 'styled-components';

const Progress = styled.progress<{ barWidth: string }>`
  display: inline-block;
  width: ${(props) => props.barWidth};
  height: 1em;
  margin-bottom: 4px !important;
  margin-top: 4px;
`;

type ProgressBarProps = {
  sizeTotal: number;
  sizeDownloaded: number;
  barWidth: string;
};

export const ProgressBar = ({
  sizeDownloaded,
  sizeTotal,
  barWidth,
}: ProgressBarProps) => (
  <div className="ProgressBar">
    <span>
      <Progress
        className="progress is-primary"
        value={(sizeDownloaded / sizeTotal) * 100}
        max="100"
        barWidth={barWidth}
      >
        {`${(sizeDownloaded / sizeTotal) * 100}%`}
      </Progress>
      <p className="help">{`${sizeDownloaded}/${sizeTotal} @ 20 MB/s`}</p>
    </span>
  </div>
);
