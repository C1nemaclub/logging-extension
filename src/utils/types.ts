export type LogPayload = {
  type: string;
  content: any;
};

export type LogType = 'error' | 'error-unhandled' | 'log' | 'warn' | 'info';
