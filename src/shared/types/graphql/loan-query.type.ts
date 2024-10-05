export type Loan = {
  id: number;
  type: number;
  amount: number;
  commentary: string | null
  createdAt: string,
}

export type GetLoanResult = {
  loans: Loan[];
}