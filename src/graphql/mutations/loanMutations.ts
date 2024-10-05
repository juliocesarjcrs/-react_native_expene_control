import { gql } from '@apollo/client';

export const CREATE_LOAN = gql`
  mutation CreateLoan($amount: Int!, $commentary: String!, $type: Int!) {
    createLoan(createLoanInput: { amount: $amount, commentary: $commentary, type: $type }) {
      id
      type
      amount
      commentary
      userId
      createdAt
    }
  }
`;

export const DELETE_LOAN = gql`
  mutation DeleteLoan($deleteLoanId: Int!) {
    deleteLoan(id: $deleteLoanId)
}
`;
