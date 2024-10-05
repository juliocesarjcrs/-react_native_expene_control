import { gql } from '@apollo/client';

export const GET_LOANS = gql`
  query GetLoans {
    loans {
      id
      type
      amount
      commentary
    }
  }
`;
