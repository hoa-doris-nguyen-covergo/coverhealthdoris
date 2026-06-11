/**
 * Test cases for: tests/proposal/02-create-proposal.spec.ts
 *
 * Each case runs the full 2-step wizard:
 *   Step 1 — select or create a client
 *   Step 2 — channel → distributor → agent → product → Create Proposal
 */

export const CREATE_PROPOSAL_CASES = [
  {
    id: 'CP-01',
    description: 'Create proposal with existing company client',
    clientType: 'company' as const,     // 'company' | 'individual'
    clientSearch: 'BA Co. 0609',        // search term to find the client
    createNewClient: false,
    newClient: undefined,

    channel: 'BAChannel001',            // must match real value in dev
    distributor: 'BADist001',           // leave '' if not required
    agent: 'BAD2Agt001 Agent',          // must match real value in dev
    product: 'Doris 3.2.0 monthly billing product',
  },
  {
    id: 'CP-02',
    description: 'Create proposal by creating a new company client inline',
    clientType: 'company' as const,
    clientSearch: '',
    createNewClient: true,
    newClient: {
      companyName: `AutoTest Co ${Date.now()}`,
      email: 'autotest@mailinator.com',
      phone: '85291234567',
      contactPerson: 'Auto Tester',
    },

    channel: 'BAChannel001',
    distributor: 'BADist001',
    agent: 'BAD2Agt001 Agent',
    product: 'Doris 3.2.0 monthly billing product',
  },
  // {
  //   id: 'CP-03',
  //   description: 'Create proposal with individual client',
  //   clientType: 'individual' as const,
  //   clientSearch: 'John',
  //   createNewClient: false,
  //   newClient: undefined,
  //   channel: 'DirectChannel',
  //   distributor: '',
  //   agent: 'DirectAgent001',
  //   product: 'Individual Medical',
  // },
];
