import * as React from 'react';
import styled from 'styled-components';
import { ProgressBar } from './ProgressBar';

const BAR_WIDTH = '300px';

const ProgressBarTd = styled.td`
  text-align: right !important;
  width: ${BAR_WIDTH};
`;

type TransferDatum = {
  id: number;
  filename: string;
  sizeDownloaded: number;
  sizeTotal: number;
  ETA: number;
  speed: number;
};

type InProgressTableState = {
  transferData: Array<TransferDatum>;
};

export default class InProgressTable extends React.Component<
  {},
  InProgressTableState
> {
  constructor(props: {}) {
    super(props);

    this.state = {
      transferData: [
        {
          id: 0,
          filename: '13.Reasons.Why.S04E05.1080p.WEB.H264-FiASCO',
          sizeDownloaded: 1000,
          sizeTotal: 1500,
          ETA: 15,
          speed: 15,
        },
        {
          id: 1,
          filename:
            'Below.Deck.Mediterranean.S05E05.1080p.WEB.H264-OATH13.Reasons.Why.S04E05.1080p.WEB.H264-FiASCO',
          sizeDownloaded: 1000,
          sizeTotal: 5000,
          ETA: 30,
          speed: 25,
        },
      ],
    };
  }

  render() {
    const { transferData } = this.state;

    return (
      <div className="box">
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th>Name</th>
              <th>Progress</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {transferData.map((transfer) => (
              <tr>
                <td>{transfer.filename}</td>
                <ProgressBarTd>
                  <ProgressBar
                    sizeDownloaded={transfer.sizeDownloaded}
                    sizeTotal={transfer.sizeTotal}
                    barWidth={BAR_WIDTH}
                  />
                </ProgressBarTd>
                <td>{transfer.ETA}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
