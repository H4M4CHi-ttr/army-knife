/** Public documentation only. User input never becomes part of this data. */
export interface ToolGuide {
  introduction: string;
  steps: readonly string[];
  exampleInput: string;
  exampleResult: string;
  limitations: readonly string[];
}

export interface GuideLabels {
  usage: string;
  example: string;
  exampleInput: string;
  exampleResult: string;
  limitations: string;
  languages: string;
  allTools: string;
  useTool: string;
  javascript: string;
  availability: string;
  disabledTitle: string;
  disabled: string;
  privacy: string;
}
