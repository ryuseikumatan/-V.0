export interface Issue {
  timestamp: number;
  originalText: string;
  problem: string;
  suggestion: string;
}

export interface AnalysisResult {
  overallScore: number;
  overallComment: string;
  issues: Issue[];
}

export interface Keyframe {
  timestamp: number;
  base64Data: string; // Base64 encoded JPEG image
}

export interface ExtractedContent {
  audioTranscript: string;
  keyframes: Keyframe[];
}
