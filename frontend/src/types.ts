import { LucideIcon } from 'lucide-react';

// Base types
export type ModelCategory = 'GPT' | 'Gemini' | 'Image' | 'Video';
export type MessageRole = 'user' | 'model';
export type MessageType = 'text' | 'image' | 'video';
export type FolderType = 'custom' | 'shorts-workflow';
export type PersonaType = 'hunter' | 'architect' | 'executive' | 'creator' | 'passive';

// Strict model interface
export interface AIModel {
  readonly id: string;
  readonly name: string;
  readonly category: ModelCategory;
  readonly apiModelName: string;
  readonly isVideo?: boolean;
  readonly isImage?: boolean;
}

export interface Message {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly type: MessageType;
  readonly mediaUrl?: string;
  readonly timestamp: number;
  readonly isStreaming?: boolean;
  readonly progress?: number; // 0-100
  readonly estimatedTime?: string;
}

// Streaming message type
export interface StreamingMessage extends Omit<Message, 'isStreaming'> {
  readonly isStreaming: true;
  readonly progress: number;
  readonly estimatedTime: string;
}

// Video options type
export interface VideoOptions {
  readonly duration: string;
  readonly resolution: string;
  readonly style: string;
  readonly aspectRatio: string;
}

// Video generation with strict typing
export interface VideoGeneration {
  readonly id: string;
  readonly prompt: string;
  readonly videoUrl: string;
  readonly options: VideoOptions;
  readonly createdAt: number;
  readonly modelId: string;
}

export interface ChatSession {
  readonly id: string;
  readonly title: string;
  readonly messages: readonly Message[];
  readonly modelId: string;
  readonly systemInstruction?: string;
  readonly folderId?: string;
  readonly lastModified: number;
  readonly videoGenerations?: readonly VideoGeneration[];
}

export interface Folder {
  readonly id: string;
  readonly name: string;
  readonly type: FolderType;
  readonly createdAt: number;
}

// Folder with chats
export interface FolderWithChats extends Folder {
  readonly chats: readonly ChatSession[];
}

export interface CardProps {
  title: string;
  description: string;
  imageUrl?: string;
  delay?: number;
}

// Onboarding types
export type OnboardingOptionValue = 'A' | 'B';

export interface OnboardingOption {
  readonly value: OnboardingOptionValue;
  readonly label: string;
  readonly text: string;
}

export interface OnboardingQuestion {
  readonly id: number;
  readonly situation: string;
  readonly options: readonly OnboardingOption[];
}

// Persona types
export interface Persona {
  readonly id: PersonaType;
  readonly name: string;
  readonly englishName: string;
  readonly description: string;
  readonly quote: string;
  readonly systemInstruction: string;
}

// Prompt template types
export interface PromptTemplate {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
  readonly isDefault?: boolean;
}

// UI Component Props
export interface CardProps {
  readonly title: string;
  readonly description: string;
  readonly imageUrl?: string;
  readonly delay?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

// Utility Types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Keys>> }[Keys];

// Error types
export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly details?: any;
}