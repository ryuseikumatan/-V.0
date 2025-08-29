import React, { useState, useRef, useCallback } from 'react';
import { AnalysisResult, Issue } from './types';
import { analyzeVideoContent } from './services/geminiService';
import { processVideo } from './services/videoProcessor';
import VideoUpload from './components/VideoUpload';
import ScoreDisplay from './components/ScoreDisplay';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import IssueList from './components/IssueList';
import { LoadingIcon, DownloadIcon, InformationCircleIcon, ChevronDownIcon } from './components/icons';

const InfoPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl mb-6 lg:mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4"
      >
        <div className="flex items-center gap-3">
          <InformationCircleIcon className="w-6 h-6 text-zinc-400" />
          <h2 className="font-semibold text-lg text-zinc-200">このツールについて</h2>
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-zinc-800 text-zinc-400 text-sm space-y-4">
          <div>
            <h3 className="font-semibold text-zinc-300 mb-1">概要</h3>
            <p>このエージェントは、アップロードされた動画コンテンツ（映像・音声）をAIが分析し、日本の薬機法（化粧品、健康食品など）に抵触する可能性のある表現を自動で検出するツールです。</p>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-300 mb-1">使い方</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>動画を選択:</strong> 分析したい動画ファイル（.mp4など）を選択します。</li>
              <li><strong>分析開始:</strong> 「分析開始」ボタンを押し、処理が完了するまで待ちます。</li>
              <li><strong>結果を確認:</strong> スコア、タイムライン、指摘事項を確認し、改善に役立ててください。</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-300 mb-1">注意点</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>動画の長さ:</strong> ブラウザ内で全ての処理を行うため、<strong>1分〜3分程度のショート動画</strong>で最適に動作します。長時間の動画は処理に失敗する可能性があります。</li>
              <li><strong>免責事項:</strong> 本エージェントの分析結果はAIによるものであり、法的アドバイスを代替するものではありません。最終的な判断は、必ず専門家にご相談ください。</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};


const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setAnalysisResult(null);
    setError(null);
    setCurrentTime(0);
  };

  const handleAnalyzeClick = async () => {
    if (!videoFile || !videoRef.current) {
      setError("動画ファイルが正しく読み込まれていません。");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setLoadingMessage('分析を準備しています...');

    try {
      // The new processVideo returns a structured object with audio and keyframes
      const extractedContent = await processVideo(videoFile, videoRef.current, setLoadingMessage);
      
      if (!extractedContent.audioTranscript && extractedContent.keyframes.length === 0) {
        throw new Error("動画から音声やキーフレームを抽出できませんでした。内容を確認してください。");
      }

      setLoadingMessage('AIが分析中です...');
      const result = await analyzeVideoContent(extractedContent);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析中に不明なエラーが発生しました。");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDownloadReport = () => {
    if (!analysisResult || !videoFile) return;

    const { overallScore, overallComment, issues } = analysisResult;
    let reportContent = `ショート動画考査エージェント 分析レポート\n`;
    reportContent += `========================================\n\n`;
    reportContent += `ファイル名: ${videoFile.name}\n`;
    reportContent += `分析日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
    reportContent += `----------------------------------------\n`;
    reportContent += `総合評価\n`;
    reportContent += `----------------------------------------\n`;
    reportContent += `コンプライアンススコア: ${overallScore} / 100\n`;
    reportContent += `総評: ${overallComment}\n\n`;
    reportContent += `----------------------------------------\n`;
    reportContent += `指摘事項一覧 (${issues.length}件)\n`;
    reportContent += `----------------------------------------\n\n`;

    if (issues.length === 0) {
      reportContent += `指摘事項はありませんでした。素晴らしい内容です。\n`;
    } else {
      issues.forEach((issue, index) => {
        const timestampStr = new Date(issue.timestamp * 1000).toISOString().substr(14, 5);
        reportContent += `[指摘 ${index + 1}]\n`;
        reportContent += `タイムスタンプ: ${timestampStr} (${issue.timestamp.toFixed(2)}秒)\n`;
        reportContent += `元の表現: 「${issue.originalText}」\n`;
        reportContent += `問題点: ${issue.problem}\n`;
        reportContent += `改善案: ${issue.suggestion}\n\n`;
      });
    }

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_report_${videoFile.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 lg:p-8 flex flex-col">
      <header className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-center text-zinc-100">
          ショート動画考査エージェント
        </h1>
        <p className="text-center text-zinc-400 mt-2">
          AIが動画の映像と音声を分析し、薬機法コンプライアンスをチェックします。
        </p>
      </header>
      
      <InfoPanel />

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <VideoUpload onFileChange={handleFileChange} onAnalyze={handleAnalyzeClick} isLoading={isLoading} hasVideo={!!videoFile} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h2 className="text-lg font-medium mb-3 text-zinc-300">スコア</h2>
              <ScoreDisplay score={analysisResult?.overallScore ?? null} isLoading={isLoading} />
            </div>
            <div className="md:col-span-2">
               <h2 className="text-lg font-medium mb-3 text-zinc-300">タイムライン</h2>
               <Timeline
                  duration={duration}
                  issues={analysisResult?.issues ?? []}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                />
            </div>
            <div className="md:col-span-3">
              <h2 className="text-lg font-medium mb-3 text-zinc-300">動画プレビュー</h2>
               <VideoPlayer
                ref={videoRef}
                src={videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex flex-col">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-zinc-900 pb-3">
            <h2 className="text-lg font-medium text-zinc-300">分析結果・改善案</h2>
            {analysisResult && !isLoading && (
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors"
                title="分析レポートをダウンロード"
              >
                <DownloadIcon className="w-4 h-4" />
                レポートをダウンロード
              </button>
            )}
          </div>

          {analysisResult && !isLoading && (
            <div className="mb-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
              <h3 className="font-semibold text-zinc-300 mb-1">総評</h3>
              <p className="text-sm text-zinc-400">{analysisResult.overallComment}</p>
            </div>
          )}
          <div className="flex-grow overflow-y-auto pr-2">
            {isLoading && (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <LoadingIcon className="w-12 h-12 mx-auto animate-spin text-blue-500" />
                  <p className="mt-4 text-lg text-zinc-300">{loadingMessage}</p>
                  <p className="text-sm text-zinc-500 mt-2">動画の長さにより数分かかることがあります。</p>
                </div>
              </div>
            )}
            {error && <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg">{error}</div>}
            {analysisResult && !isLoading && <IssueList issues={analysisResult.issues} onIssueClick={handleSeek} />}
            {!isLoading && !analysisResult && !error && (
              <div className="flex justify-center items-center h-full text-center text-zinc-500">
                <p>動画をアップロードして「分析開始」ボタンを押してください。</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;