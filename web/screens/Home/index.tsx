import * as React from 'react';
import styled from 'styled-components';

import QuickLook from './components/QuickLook';
import InProgressTable from './components/InProgressTable';

const Columns = styled.div`
  margin-top: 50px;
`;

// eslint-disable-next-line react/prefer-stateless-function
export default class Home extends React.Component<{}, {}> {
  render() {
    return (
      <div className="Home">
        <Columns className="columns">
          <div className="column is-one-fifth" />
          <div className="column">
            <h1>Home</h1>
          </div>
          <div className="column is-one-fifth" />
        </Columns>
        <Columns className="columns">
          <div className="column is-one-fifth" />
          <div className="column">
            <QuickLook />
          </div>
          <div className="column is-one-fifth" />
        </Columns>
        <Columns className="columns">
          <div className="column is-one-fifth" />
          <div className="column">
            <h2 style={{ marginBottom: '10px' }}>In Progress</h2>
            <InProgressTable />
          </div>
          <div className="column is-one-fifth" />
        </Columns>
      </div>
    );
  }
}
