import * as React from 'react';
import styled from 'styled-components';

const Columns = styled.div`
  margin: 50px;
`;

export class Home extends React.Component<{}, {}> {
  render() {
    return (
      <Columns className="columns">
        <div className="column">First column</div>
        <div className="column">Second column</div>
        <div className="column">Third column</div>
        <div className="column">Fourth column</div>
      </Columns>
    );
  }
}
