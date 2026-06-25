// Shared TypeScript contracts for OpenCut Studio AI integration.
// This package must stay framework-agnostic: no React, Next.js, Vite, Zustand, or path aliases.

export type AIErrorType =
  | "connection_refused"
  | "timeout"
  | "backend_error"
  | "network_error"
  | "unknown";

export interface AIBackendStatus {
  available: boolean;
  models: string[];
  gpuAvailable: boolean;
  memoryUsage?: {
    ram?: {
      usedMb: number;
      totalMb: number;
      percent: number;
    };
    gpu?: {
      usedMb: number;
      totalMb: number;
    };
  };
  error?: string;
  errorType?: AIErrorType;
  version?: string;
  services?: string[];
}

export interface ServiceInfo {
  status: string;
  version?: string;
  port?: number;
  url?: string;
  models?: { name: string; size?: number; modified_at?: string }[];
  default_model?: string;
  model_size?: string;
  device?: string;
  description?: string;
  detail?: string;
  model_loaded?: boolean;
  model_installed?: boolean;
  model_name?: string;
  install_command?: string;
  supported_languages?: string[];
}

export type ServicesHealth = Record<string, ServiceInfo>;

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words: TranscriptionWord[];
  speaker?: string;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export type EditorActionType =
  | "REMOVE_SEGMENTS"
  | "ADD_SUBTITLE_TRACK"
  | "ADD_IMAGE_OVERLAY"
  | "TRIM_CLIP"
  | "ADD_TRANSITION"
  | "SPLIT_CLIP"
  | "ADD_TEXT_OVERLAY"
  | "ADJUST_SPEED"
  | "ADD_VOICEOVER"
  | "REMOVE_SILENCE"
  | "REMOVE_FILLERS"
  | "ADD_CHAPTER_MARKERS"
  | "DENOISE_AUDIO"
  | "GENERATE_IMAGE"
  | "SET_CANVAS_SIZE"
  | "ADD_MUSIC"
  | "NORMALIZE_AUDIO"
  | "AUTO_DUCK"
  | "COLOR_CORRECT"
  | "EXPORT_PROJECT"
  | "cut"
  | "trim"
  | "delete"
  | "split"
  | "add_text"
  | "add_transition"
  | "adjust_speed"
  | "adjust_volume"
  | "move_clip"
  | "add_effect"
  | "add_filter"
  | "color_correct"
  | "add_keyframe"
  | "fade_in"
  | "fade_out"
  | "mute"
  | "duplicate"
  | "ripple_delete";

export interface EditorAction {
  type: EditorActionType | string;
  target?: string | null;
  params: Record<string, unknown>;
  description?: string;
}

export interface CommandRequest {
  command: string;
  timeline_state?: unknown;
  model?: string;
}

export interface CommandResult {
  actions: EditorAction[];
  explanation: string;
  confidence?: number;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  raw_response?: string;
}

export interface TTSRequest {
  text: string;
  language: string;
  speakerWav?: string;
  speaker?: string;
}

export interface TTSResult {
  audioUrl: string;
  duration: number;
}

export interface ImageGenParams {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps: number;
  guidanceScale: number;
  model?: string;
}

export interface ImageGenResult {
  imageUrl: string;
  seed: number;
  prompt: string;
}

export interface DenoiseResult {
  audioUrl: string;
  originalUrl: string;
}

export interface SilenceRegion {
  start: number;
  end: number;
  duration: number;
}

export interface FillerWord {
  word: string;
  start: number;
  end: number;
  segmentIndex: number;
  wordIndex: number;
  isFiller: boolean;
}

export interface Chapter {
  title: string;
  start: number;
  end: number;
  summary?: string;
}

export interface StructureAnalysis {
  chapters: Chapter[];
  highlights: { start: number; end: number; reason: string }[];
  suggestedTitle?: string;
  suggestedDescription?: string;
}

export interface BRollSuggestion {
  segmentIndex: number;
  startTime: number;
  endTime: number;
  segmentText: string;
  visualDescription: string;
  imagePrompt: string;
  stockKeywords: string[];
  mood: string;
  priority: "high" | "medium" | "low";
}

export interface BRollSuggestionsResult {
  suggestions: BRollSuggestion[];
  totalSegments: number;
}

export interface AISuggestion {
  id: string;
  type: "warning" | "improvement" | "info";
  message: string;
  action?: EditorAction;
  dismissed: boolean;
}

export type SubtitlePreset = "captions" | "classic" | "modern" | "karaoke";

export interface SubtitleStyle {
  preset: SubtitlePreset;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  outlineColor: string;
  outlineWidth: number;
  position: "top" | "center" | "bottom";
  animation: "none" | "word-highlight" | "karaoke-fill" | "bounce-in";
}

export interface ClipCandidate {
  title: string;
  start: number;
  end: number;
  score: number;
  reason: string;
  tags: string[];
}

export interface FindClipsResult {
  clips: ClipCandidate[];
  total_duration: number;
}

export interface KeywordEntry {
  word: string;
  color: string;
  category: string;
}

export interface KeywordResult {
  keywords: KeywordEntry[];
}

export interface QuestionCard {
  question: string;
  timestamp: number;
  theme: "dark" | "gradient" | "bold" | "neon";
  emoji: string;
}

export interface QuestionCardsResult {
  cards: QuestionCard[];
}

export interface FaceBBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface FaceFrame {
  timestamp: number;
  faces: FaceBBox[];
}

export interface FaceDetectionResult {
  frames: FaceFrame[];
  video_width: number;
  video_height: number;
  duration: number;
  total_faces_detected: number;
}

export interface EmotionSegment {
  start: number;
  end: number;
  emotion: string;
  intensity: number;
}

export interface EmotionDetectionResult {
  emotions: EmotionSegment[];
  method: string;
  peak_emotion: string;
}

export interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
}

export interface SpeakerDiarizationResult {
  segments: SpeakerSegment[];
  num_speakers: number;
  method: string;
}

export interface ReelTemplateSegment {
  order: number;
  start_time: number;
  end_time: number;
  duration: number;
  title: string;
  narration: string;
  visual_description: string;
  key_message: string;
  audio_mood: string;
}

export interface AudioSuggestion {
  query: string;
  mood: string;
  tags: string[];
}

export interface ReelTemplate {
  topic: string;
  total_duration: number;
  style: string;
  title: string;
  segments: ReelTemplateSegment[];
  background_audio: AudioSuggestion;
}

export type VideoProvider = "replicate" | "seedance" | "stability" | "luma" | "kling" | "local";
export type VideoGenMode = "text-to-video" | "image-to-video" | "video-to-video";

export interface VideoGenRequest {
  prompt: string;
  duration: number;
  width: number;
  height: number;
  provider: VideoProvider;
  model?: string;
  mode?: VideoGenMode;
  imageUrl?: string;
  videoUrl?: string;
}

export interface VideoGenResult {
  videoUrl: string;
  prompt: string;
  duration: number;
  provider: string;
  status: "completed" | "processing" | "failed";
  jobId?: string;
  error?: string;
}

export interface PromptGenResult {
  prompt: string;
  enhancedDescription: string;
}

export type ComputeMode = "auto" | "cpu" | "cuda";

export interface StackMemoryEstimate {
  ollama_mb: number;
  whisper_mb: number;
  tts_mb: number;
  kv_cache_compressed_mb: number;
  kv_cache_baseline_mb: number;
  total_with_turboquant_mb: number;
  total_without_turboquant_mb: number;
  savings_mb: number;
  kv_bits: number;
  kv_compression_ratio?: number;
  source?: "measured" | "estimated";
}

export interface TurboQuantStatus {
  kv_cache_bits: number;
  kv_cache_bits_requested?: number;
  kv_cache_bits_effective?: number;
  kv_compression_ratio: number;
  kv_compression_ratio_effective?: number;
  kv_quality: string;
  kv_cosine_similarity: number;
  memory_budget: string;
  model_tier: string;
  compute_mode: ComputeMode;
  recommended_tier: string;
  recommended_model: {
    name: string;
    ollama_tag: string;
    memory_mb: number;
    quality: string;
    quantization: string;
  };
  hardware: {
    ram_total_mb: number;
    ram_available_mb: number;
    gpu_available: boolean;
    gpu_vram_mb: number;
    gpu_name: string | null;
  };
  stack_memory_estimate: StackMemoryEstimate;
  inference_service: {
    available: boolean;
    reason?: string;
    model?: string;
    compute_mode?: string;
    turboquant_engine_available?: boolean;
    compression_ratio_last?: number | null;
  };
}

export interface KVCacheConfig {
  bits: number;
  compression_ratio: number;
  cosine_similarity: number;
  quality: string;
  recommended: boolean;
  description: string;
}

export interface ModelTierSpec {
  name: string;
  label: string;
  description: string;
  min_ram_mb: number;
  models: {
    name: string;
    ollama_tag: string;
    memory_mb: number;
    quality: string;
    description: string;
    quantization: string;
  }[];
}

export interface ModelRecommendation {
  recommendation: {
    ollama_model: string;
    ollama_model_name: string;
    ollama_memory_mb: number;
    ollama_quality: string;
    ollama_quantization: string;
    whisper_model: string;
    whisper_compute_type: string;
    whisper_memory_mb: number;
    kv_cache_bits: number;
  };
  tier: string;
  budget: string;
  hardware: TurboQuantStatus["hardware"];
  stack_estimate: StackMemoryEstimate;
}

export interface TQModelEntry {
  id: string;
  name: string;
  family: string;
  params: string;
  memory_fp16_mb: number;
  memory_4bit_mb: number;
  context_length: number;
  description: string;
  turboquant_validated: boolean;
  downloaded: boolean;
  loaded: boolean;
  downloading: boolean;
  loading: boolean;
  size_on_disk_mb?: number;
  download_progress?: { status: string; progress: number; message: string };
  quantization?: string;
  request_count?: number;
}

export interface TQModelsResponse {
  object: string;
  data: TQModelEntry[];
  active_model: string | null;
}

export interface TQDownloadProgress {
  status: "downloading" | "completed" | "error";
  progress: number;
  message: string;
}

export interface TQLoadResult {
  status: string;
  model_id: string;
  device: string;
  quantization: string;
  memory: Record<string, number>;
}
