
export type Language = 'RU' | 'EN';

export enum ProjectProfile {
  PC_AAA = 'profile_pc_aaa.tfprofile',
  ANDROID_MID = 'profile_android_mid.tfprofile',
  SERVER_DOCKER = 'profile_server_docker.tfprofile'
}

export type WorkspaceTab = 'SCENE' | 'CODE' | 'NETGRAPH' | 'ASSETS' | 'ORCHESTRATOR';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  path: string;
  content?: string;
}

export interface DiagnosticIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  suggestion: string;
}

export interface AISuggestion {
  id: string;
  type: 'create_file' | 'modify_config' | 'optimize' | 'batch_setup' | 'fix_issue';
  label: string;
  path: string;
  data: string;
  batch?: AISuggestion[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: AISuggestion[];
  isSearching?: boolean;
}

export interface ProjectState {
  name: string;
  profile: ProjectProfile;
  language: Language;
  render2D: boolean;
  issues: DiagnosticIssue[];
}

export interface ServerInstance {
  id: string;
  name: string;
  type: 'auth' | 'world' | 'proxy' | 'db';
  status: 'running' | 'stopped' | 'error' | 'deploying';
  load: number;
  logs?: string[];
}
