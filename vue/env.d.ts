
/// <reference types="./vite-env-override.d.ts" />
/// <reference types="vite/client" />

declare module 'vue' {
  export interface ComponentCustomProperties {
    $t(key: string, ...args: any[]): string
  }
}

interface Window {
  IIB_container_id?: string
}
