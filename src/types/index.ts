// 录制事件类型
export type ActionType =
  | 'click'
  | 'input'
  | 'scroll'
  | 'navigate'
  | 'keypress'
  | 'resize';

// 用户操作记录
export interface UserAction {
  type: ActionType;
  timestamp: number;
  selector: string;
  xpath: string;
  text: string;
  value?: string;
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  tagName?: string;
  role?: string;
  ariaLabel?: string;
  placeholder?: string;
  name?: string;
  inputType?: string;
  href?: string;
  disabled?: boolean;
  checked?: boolean;
  masked?: boolean;
  scrollX?: number;
  scrollY?: number;
  viewportWidth: number;
  viewportHeight: number;
  url: string;
  tabId?: number;
  windowId?: number;
}

// 网络请求记录
export interface NetworkRequest {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  statusText?: string;
  contentType?: string;
  requestSize?: number;
  responseSize?: number;
  truncated?: boolean;
  duration: number;
  type: 'fetch' | 'xhr';
  error?: string;
  tabId?: number;
  windowId?: number;
}

// 控制台日志记录
export interface ConsoleLog {
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  args: string[];
  url?: string;
  line?: number;
  col?: number;
  stack?: string;
  tabId?: number;
  windowId?: number;
}

// JS 错误记录
export interface JSError {
  timestamp: number;
  type: 'jsError' | 'promiseError' | 'resourceError';
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  tagName?: string;
  sourceUrl?: string;
  tabId?: number;
  windowId?: number;
}

// 截图记录
export interface Screenshot {
  timestamp: number;
  dataUrl: string;
  trigger: 'action' | 'error' | 'interval';
}

// 页面跳转记录（跨页面录制）
export interface SessionPage {
  url: string;
  title: string;
  timestamp: number;
  tabId?: number;
  windowId?: number;
  openerTabId?: number;
  source?: string;
}

// 完整的录制会话
export interface RecordingSession {
  id: string;
  url: string;
  title: string;
  startTime: number;
  endTime: number;
  userAgent: string;
  viewport: { width: number; height: number };
  // rrweb 录制的事件
  rrwebEvents: unknown[];
  // 用户操作
  actions: UserAction[];
  // 网络请求
  networkRequests: NetworkRequest[];
  // 控制台日志
  consoleLogs: ConsoleLog[];
  // JS 错误
  errors: JSError[];
  // 截图
  screenshots: Screenshot[];
  // 跨页面：记录访问过的所有页面
  pages: SessionPage[];
}

// 消息类型（Content Script <-> Background）
export type MessageType =
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  | 'RECORDING_STATUS'
  | 'RRWEB_EVENT'
  | 'RRWEB_EVENTS_BATCH'
  | 'USER_ACTION'
  | 'NETWORK_REQUEST'
  | 'CONSOLE_LOG'
  | 'JS_ERROR'
  | 'ROUTE_CHANGE'
  | 'SCREENSHOT'
  | 'GET_RECORDING';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

// 页面注入的请求拦截消息
export interface InjectedNetworkMessage {
  type: '__record_fetch' | '__record_xhr' | '__record_route';
  url: string;
  method?: string;
  status?: number;
  body?: string;
  requestBody?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  duration?: number;
  title?: string;
  source?: string;
  timestamp?: number;
}
