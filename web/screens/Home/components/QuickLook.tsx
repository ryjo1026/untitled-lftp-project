import * as React from 'react';
import styled from 'styled-components';

const Card = styled.div<{ backgroundColor: string | null }>`
  padding-left: 10%;
  color: #fff;
  background-color: ${(props) => props.backgroundColor || 'white'};
`;

type CardDatum = {
  color: string;
  title: string;
  body: string;
  stat: Number;
};

type QuickLookState = {
  cardData: Array<CardDatum>;
};

// eslint-disable-next-line react/prefer-stateless-function
export default class QuickLook extends React.Component<{}, QuickLookState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      cardData: [
        {
          color: '#F26A4B',
          title: 'In Progress',
          body: 'currently downloading',
          stat: 4,
        },
        {
          color: '#5F67F3',
          title: 'On Deck',
          body: 'currently queued',
          stat: 2,
        },
        {
          color: '#2BD9B9',
          title: 'Completed',
          body: 'finished downloading',
          stat: 100,
        },
      ],
    };
  }

  render() {
    const { cardData } = this.state;

    return (
      <div className="QuickLook">
        <div className="columns">
          {cardData.map((cardDatum) => (
            <div className="column is-one-third">
              <Card className="box" backgroundColor={cardDatum.color}>
                <h2>{cardDatum.title}</h2>
                <div>
                  <h1 style={{ fontSize: '48px' }}>{cardDatum.stat}</h1>
                  <h4>{cardDatum.body}</h4>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
