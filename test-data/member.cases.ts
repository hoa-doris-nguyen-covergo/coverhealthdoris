/**
 * Test cases for: tests/offer/05-member.spec.ts
 *
 * Covers:
 *   - Add employee (primary member) manually
 *   - Add dependent member
 *   - Upload members via CSV / Excel
 *   - Edit member
 *   - View member details
 *   - View premium breakdown from member details
 *   - View instalment breakdown from member billing plan tab
 *   - Upload document in member details → Documents tab
 *   - Add / edit health questionnaire in member details → UW tab
 */

export const ADD_MEMBER_CASES = [
  {
    id: 'AM-01',
    description: 'Add employee (primary member) manually',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',                    // leave '' to use first offer
    memberType: 'employee' as const,    // 'employee' | 'dependent'
    member: {
      firstName: 'John',
      lastName: 'AutoTest',
      dob: '01/01/1990',
      gender: 'Male',
      email: 'john.autotest@mailinator.com',
      idNumber: 'A123456789',
      className: '',                    // leave '' if class not required
    },
  },
  {
    id: 'AM-02',
    description: 'Add dependent member',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    memberType: 'dependent' as const,
    member: {
      firstName: 'Jane',
      lastName: 'AutoTest',
      dob: '15/06/1992',
      gender: 'Female',
      relationship: 'Spouse',
      idNumber: '',
      className: '',
    },
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const UPLOAD_MEMBER_CASES = [
  {
    id: 'UM-01',
    description: 'Upload members via CSV file',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    filePath: './test-data/files/members-sample.csv', // place your file here
  },
  // {
  //   id: 'UM-02',
  //   description: 'Upload members via Excel file',
  //   proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
  //   offerNumber: '',
  //   filePath: './test-data/files/members-sample.xlsx',
  // },
];

export const EDIT_MEMBER_CASES = [
  {
    id: 'EM-01',
    description: 'Edit an existing member email',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    memberName: 'John AutoTest',        // used to identify the row to click
    updatedFields: {
      email: 'john.updated@mailinator.com',
    },
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const DOCUMENT_UPLOAD_CASES = [
  {
    id: 'DU-01',
    description: 'Upload a PDF document to member details',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    memberName: 'John AutoTest',
    filePath: './test-data/files/sample-document.pdf', // place your file here
  },
  // ── add more below ────────────────────────────────────────────────────────
];

export const UW_QUESTIONNAIRE_CASES = [
  {
    id: 'UW-01',
    description: 'Add health questionnaire from UW tab',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    memberName: 'John AutoTest',
    action: 'add' as const,             // 'add' | 'edit'
  },
  {
    id: 'UW-02',
    description: 'Edit existing health questionnaire',
    proposalId: '8493c647-3af6-4e12-9a1b-5b4e33595b2b',
    offerNumber: '',
    memberName: 'John AutoTest',
    action: 'edit' as const,
  },
  // ── add more below ────────────────────────────────────────────────────────
];
