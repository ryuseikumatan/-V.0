import { pipeline } from '@xenova/transformers';
import { Keyframe, ExtractedContent } from '../types';

// Declare global variables loaded from script tags
declare const FFMPEG: any;

/**
 * Singleton class to manage the expensive initialization of the transcription model.
 */
class TranscriptionPipeline {
  // FIX: Added 'as const' to ensure the type is inferred as a literal, which is assignable to PipelineType.
  static task = 'automatic-speech-recognition' as const;
  static model = 'Xenova/whisper-tiny'; // Efficient model for client-side execution
  static instance: any = null;

  static async getInstance(progress_callback: (progress: any) => void) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

/**
 * Extracts the audio track from a video file and converts it to a WAV format.
 */
async function extractAudio(videoFile: File, onProgress: (message: string) => void): Promise<Uint8Array | null> {
  try {
    onProgress('FFMPEGを初期化中...');
    const ffmpeg = new FFMPEG.FFmpeg();
    ffmpeg.on('log', ({ message }: { message: string }) => {
      // console.log(message); // Useful for debugging FFMPEG
    });

    // FIX: Synchronize core version with the library version loaded in index.html (0.12.10)
    const coreURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js';
    await ffmpeg.load({ coreURL });

    onProgress('動画ファイルをメモリに書き込み中...');
    const fileData = new Uint8ClampedArray(await videoFile.arrayBuffer());
    await ffmpeg.writeFile(videoFile.name, fileData);

    onProgress('オーディオトラックを抽出・変換中...');
    await ffmpeg.exec(['-i', videoFile.name, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', 'output.wav']);

    onProgress('音声データを読み込み中...');
    const data = await ffmpeg.readFile('output.wav');
    await ffmpeg.terminate();

    return data as Uint8Array;
  } catch (error) {
     console.error("FFMPEG failed:", error);
     // Don't throw, allow video-only analysis
     return null;
  }
}

/**
 * Transcribes audio data using a pre-trained Whisper model.
 */
async function transcribeAudio(audioData: Uint8Array, onProgress: (message: string) => void): Promise<string> {
    onProgress('音声認識モデルを準備中...');
    const transcriber = await TranscriptionPipeline.getInstance((p: any) => {
    if (p.status === 'download') {
        const progress = (p.progress || 0).toFixed(2);
        onProgress(`音声モデルをダウンロード中... ${progress}%`);
    }
    });

    onProgress('音声の文字起こしを実行中...');
    const transcription = await transcriber(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: 'japanese',
    task: 'transcribe',
    });

    if (transcription && Array.isArray(transcription.chunks)) {
    return transcription.chunks.map((chunk: any) =>
        `(${Math.floor(chunk.timestamp[0])}s-${Math.floor(chunk.timestamp[1])}s): 「${chunk.text.trim()}」`
    ).join('\n');
    }
    return '';
}

/**
 * Extracts visually distinct keyframes from a video using a scene detection algorithm.
 * This is much more efficient than processing every single frame or second.
 */
async function extractKeyframes(videoEl: HTMLVideoElement, onProgress: (message: string) => void): Promise<Keyframe[]> {
  onProgress('キーフレーム抽出の準備中...');
  const keyframes: Keyframe[] = [];
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error("Canvasコンテキストが取得できません。");

  const DOWNSAMPLE_WIDTH = 64;
  const DOWNSAMPLE_HEIGHT = 36;
  const FRAME_RATE = 5; // Analyze 5 frames per second
  const CHANGE_THRESHOLD = 15; // Lower is more sensitive to changes. Lowered from 25 to 15.

  canvas.width = DOWNSAMPLE_WIDTH;
  canvas.height = DOWNSAMPLE_HEIGHT;

  let lastPixelData: Uint8ClampedArray | null = null;
  let lastKeyframeTime = -1;
  const duration = videoEl.duration;

  // Wait for video to be ready and seek to the beginning
  videoEl.currentTime = 0;
  await new Promise(r => videoEl.onseeked = r);

  // FIX: Capture the first frame at full resolution to avoid missing details.
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = videoEl.videoWidth;
  fullCanvas.height = videoEl.videoHeight;
  const fullContext = fullCanvas.getContext('2d');
  if (!fullContext) {
      throw new Error("Could not get 2d context for full canvas");
  }
  fullContext.drawImage(videoEl, 0, 0);
  const firstFrameDataUrl = fullCanvas.toDataURL('image/jpeg', 0.8);
  keyframes.push({ timestamp: 0, base64Data: firstFrameDataUrl.split(',')[1] });

  // Now, use the downsampled canvas for change detection
  context.drawImage(videoEl, 0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
  lastPixelData = context.getImageData(0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT).data;
  lastKeyframeTime = 0;


  return new Promise(resolve => {
    const processFrame = async (currentTime: number) => {
      onProgress(`キーフレームを抽出中... (${Math.round(currentTime)}s / ${Math.round(duration)}s)`);
      videoEl.currentTime = currentTime;
    };

    videoEl.onseeked = () => {
        if (!context || !lastPixelData) return;
        
        context.drawImage(videoEl, 0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
        const currentPixelData = context.getImageData(0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT).data;
        
        let sad = 0; // Sum of Absolute Differences
        for (let i = 0; i < currentPixelData.length; i += 4) {
            sad += Math.abs(currentPixelData[i] - lastPixelData[i]);
            sad += Math.abs(currentPixelData[i + 1] - lastPixelData[i + 1]);
            sad += Math.abs(currentPixelData[i + 2] - lastPixelData[i + 2]);
        }
        const avgDifference = sad / (DOWNSAMPLE_WIDTH * DOWNSAMPLE_HEIGHT * 3);

        // Add a keyframe if the scene changed significantly and it's been at least 1 second since the last one
        if (avgDifference > CHANGE_THRESHOLD && videoEl.currentTime - lastKeyframeTime > 1) {
            fullContext.drawImage(videoEl, 0, 0);
            const dataUrl = fullCanvas.toDataURL('image/jpeg', 0.8);
            keyframes.push({ timestamp: videoEl.currentTime, base64Data: dataUrl.split(',')[1] });
            
            lastPixelData = currentPixelData;
            lastKeyframeTime = videoEl.currentTime;
        }

        const nextTime = videoEl.currentTime + 1 / FRAME_RATE;
        if (nextTime < duration) {
            processFrame(nextTime);
        } else {
            videoEl.onseeked = null; // Clean up listener
            resolve(keyframes);
        }
    };
    
    // Start the process
    processFrame(1 / FRAME_RATE);
  });
}


/**
 * Orchestrates the full video processing pipeline: audio extraction, transcription, and keyframe extraction.
 */
export const processVideo = async (
  videoFile: File,
  videoEl: HTMLVideoElement,
  onProgress: (message: string) => void
): Promise<ExtractedContent> => {
  let audioTranscript = '';
  try {
    const audioData = await extractAudio(videoFile, onProgress);
    if (audioData) {
      audioTranscript = await transcribeAudio(audioData, onProgress);
    }
  } catch (error) {
    console.error('Audio processing failed:', error);
    onProgress('音声処理に失敗しました。映像のみ分析を続けます。');
  }

  const keyframes = await extractKeyframes(videoEl, onProgress);
  
  onProgress('分析結果をまとめています...');
  return { audioTranscript, keyframes };
};