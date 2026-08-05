export {};

declare global {
  interface Window {
    systemAPI?: {
      getSystemInfo: () => Promise<any>;
      getStorageInfo: () => Promise<{ freeBytes: number; totalBytes: number }>;
      checkDocker: () => Promise<boolean>;
      openExternal: (url: string) => void;
      dockerPull: (image: string) => Promise<string>;
      readSettings: () => Promise<Record<string, any>>;
      writeSettings: (patch: Record<string, any>) => void;
      getLaunchAtStartup: () => Promise<boolean>;
      setLaunchAtStartup: (enabled: boolean) => void;
    };
  }
}
