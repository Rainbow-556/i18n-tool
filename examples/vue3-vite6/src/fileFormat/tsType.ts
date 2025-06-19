export interface Person {
  name: string;
  age: number;
}

export enum CaseTab {
  CaseDetail = 'CaseDetail',
  CaseSipCalls = 'CaseSipCalls',
  CaseVoiceRobotCalls = 'CaseVoiceRobotCalls',
  BorrowerCases = 'BorrowerCases',
  BorrowerInformation = 'BorrowerInformation',
  BorrowerIdentity = 'BorrowerIdentity',
  BorrowerContacts = 'BorrowerContacts',
  BorrowerAccounts = 'BorrowerAccounts'
}

export enum CaseType {
  AboutToPastDue = 1,
  Overdue = 2
}
