/**
 * Test cases for: tests/proposal/reassign-agent.spec.ts
 *
 * For RA-04 and RA-05 to run end-to-end you need:
 *   - distributor: a distributor code visible in the Distributors & Agents dropdown
 *   - fromAgent:   the current agent name shown in the Agent column for the target proposal
 *   - toAgent:     the new agent name to reassign to (must belong to the same distributor)
 *   - proposalNumber: the proposal number whose row will be checked after reassignment
 *
 * Leave these blank to skip those tests automatically.
 */

export const REASSIGN_AGENT_CASES = [
  {
    id: 'RA-04',
    description: 'Reassign a single proposal to a new agent and verify agent column updates',
    distributor: '',          // e.g. 'BRBF'
    proposalNumber: '',       // e.g. 'AFBC8D'  — the proposal to reassign
    fromAgent: '',            // e.g. 'Vy01 DD Agent'
    toAgent: '',              // e.g. 'BAD2Agt001 Agent'
  },
  {
    id: 'RA-05',
    description: 'Reassign multiple proposals at once and verify agent column updates for all',
    distributor: '',
    proposalNumbers: [] as string[],   // e.g. ['AFBC8D', '31A629']
    fromAgent: '',
    toAgent: '',
  },
];
