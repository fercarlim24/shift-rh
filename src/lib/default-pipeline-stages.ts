export const DEFAULT_PIPELINE_STAGES = [
  { name: "Triagem", order: 0, isTerminal: false, terminalType: null },
  { name: "Entrevista", order: 1, isTerminal: false, terminalType: null },
  { name: "Proposta", order: 2, isTerminal: false, terminalType: null },
  { name: "Contratado", order: 3, isTerminal: true, terminalType: "HIRED" },
  { name: "Declinado", order: 4, isTerminal: true, terminalType: "DECLINED" },
] as const;
