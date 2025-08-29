import { GoogleGenAI, Type, Content, Part } from "@google/genai";
import { AnalysisResult, ExtractedContent } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.INTEGER,
      description: '日本の薬機法への準拠スコア。0（多くの違反）から100（完全に準拠）までの整数。',
    },
    overallComment: {
      type: Type.STRING,
      description: '分析結果の総評。スコアと問題点に基づいた、簡潔な一行アドバイス。（例：「要改善。特に誇大広告に関する表現の見直しが必要です。」）',
    },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: {
            type: Type.NUMBER, // Changed to NUMBER to allow for float values
            description: '問題が発生した動画のタイムスタンプ（秒）。画像フレームの時間か、音声の時間に基づきます。',
          },
          originalText: {
            type: Type.STRING,
            description: '画像や音声から特定された、問題のあるテキスト表現。',
          },
          problem: {
            type: Type.STRING,
            description: 'このコンテンツが薬機法に抵触する理由の詳細な説明。視覚的文脈も考慮してください。',
          },
          suggestion: {
            type: Type.STRING,
            description: '問題のあるコンテンツに対する、薬機法に準拠した修正案。',
          },
        },
        required: ['timestamp', 'originalText', 'problem', 'suggestion'],
      },
    },
  },
  required: ['overallScore', 'overallComment', 'issues'],
};


export const analyzeVideoContent = async (extractedContent: ExtractedContent): Promise<AnalysisResult> => {
  const { audioTranscript, keyframes } = extractedContent;

  const mainPrompt = `
    あなたは日本の薬機法（医薬品、医療機器等の品質、有効性及び安全性の確保等に関する法律）の専門家であり、レビューアシスタントです。
    あなたのタスクは、提示された動画コンテンツを分析し、薬機法に抵触する可能性のある表現を特定し、その上で自己改善（Self-Refine）プロセスを用いて、より質の高い最終的なフィードバックを生成することです。

    **思考プロセス:**
    1.  **初期分析:** まず、提示された「音声の文字起こし」と「キーフレーム画像」を総合的に分析し、薬機法（特に化粧品、健康食品、医薬部外品の広告）に違反する可能性のある箇所をすべてリストアップします。承認されていない効果・効能の標榜、誇大広告、安全性の誤認を招く表現などに注意してください。キーフレームの視覚的文脈も考慮に入れます。
    2.  **自己レビュー:** 次に、あなた自身の初期分析を批判的にレビューします。「この指摘は厳しすぎないか？」「法的根拠は明確か？」「もっと分かりやすい改善案はないか？」「見落としている点はないか？」と自問自答してください。
    3.  **最終出力:** 自己レビューを踏まえて、最も正確で実用的な分析結果を生成します。各問題点について、タイムスタンプ、問題表現、具体的で根拠のある問題点、そして遵守可能な修正案を提示してください。最後に、全体的なコンプライアンススコア（0-100）と、そのスコアを要約する一行の総評を生成します。
  `;

  // Build the multi-part content array
  const parts: Part[] = [
    { text: mainPrompt },
    { text: `--- \nオーディオ文字起こし:\n---\n${audioTranscript || '（音声は検出されませんでした）'}` },
    { text: '--- \nビデオキーフレーム:\n---' }
  ];

  if (keyframes.length === 0) {
    parts.push({ text: '（キーフレームは検出されませんでした）'});
  } else {
     for (const frame of keyframes) {
      parts.push({ text: `タイムスタンプ: ${frame.timestamp.toFixed(2)}秒` });
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: frame.base64Data,
        }
      });
    }
  }
 
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // FIX: The 'contents' property expects an array of Content objects for multi-part requests.
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as AnalysisResult;
    
    // Ensure timestamps are sorted
    result.issues.sort((a, b) => a.timestamp - b.timestamp);

    return result;
  } catch (error) {
    console.error("Error analyzing video content with Gemini:", error);
    throw new Error("AIによる分析に失敗しました。プロンプトまたはAPIキーを確認してください。");
  }
};