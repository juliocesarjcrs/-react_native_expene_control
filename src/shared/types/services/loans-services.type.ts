export type  Loan = {
  id: number;
  date: string,
  createdAt: string,
  type: number;
  commentary: string | null
  loan: string
}


export type GetLoansResponse = {
  data: Loan[];
}
// export type PayloadCreateLoan = Omit<Loan, 'data'>;
