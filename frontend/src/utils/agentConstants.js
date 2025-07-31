/**
 * Agent constants for consistent ID mapping across the frontend
 */

// Agent IDs
export const EMAIL_AGENT_ID = 1;
export const IDEAS_AGENT_ID = 8;
export const QUOTE_AGENT_ID = 5;

// Agent Names
export const EMAIL_AGENT_NAME = "Email Agent";
export const IDEAS_AGENT_NAME = "Ideas Agent";
export const QUOTE_AGENT_NAME = "Quote Agent";

// Agent ID to Name mapping
export const AGENT_ID_TO_NAME = {
  [EMAIL_AGENT_ID]: EMAIL_AGENT_NAME,
  [IDEAS_AGENT_ID]: IDEAS_AGENT_NAME,
  [QUOTE_AGENT_ID]: QUOTE_AGENT_NAME,
};

// Agent Name to ID mapping
export const AGENT_NAME_TO_ID = {
  [EMAIL_AGENT_NAME]: EMAIL_AGENT_ID,
  [IDEAS_AGENT_NAME]: IDEAS_AGENT_ID,
  [QUOTE_AGENT_NAME]: QUOTE_AGENT_ID,
};

/**
 * Get agent name by ID
 * @param {number} agentId - The agent ID
 * @returns {string} The agent name
 */
export const getAgentName = (agentId) => {
  return AGENT_ID_TO_NAME[agentId] || `Agent ${agentId}`;
};

/**
 * Get agent ID by name
 * @param {string} agentName - The agent name
 * @returns {number} The agent ID
 */
export const getAgentId = (agentName) => {
  return AGENT_NAME_TO_ID[agentName] || 0;
};

/**
 * Check if agent is Email Agent
 * @param {number} agentId - The agent ID
 * @returns {boolean} True if Email Agent
 */
export const isEmailAgent = (agentId) => {
  return agentId === EMAIL_AGENT_ID;
};

/**
 * Check if agent is Ideas Agent
 * @param {number} agentId - The agent ID
 * @returns {boolean} True if Ideas Agent
 */
export const isIdeasAgent = (agentId) => {
  return agentId === IDEAS_AGENT_ID;
};

/**
 * Check if agent is Quote Agent
 * @param {number} agentId - The agent ID
 * @returns {boolean} True if Quote Agent
 */
export const isQuoteAgent = (agentId) => {
  return agentId === QUOTE_AGENT_ID;
}; 