declare module 'which' {
  export interface WhichOptions {
    path?: string
    pathExt?: string
    all?: boolean
    nothrow?: boolean
  }

  export interface WhichResult {
    status: boolean
    output: string | null
  }

  export default function which (command: string, options: WhichOptions & { nothrow: true }): Promise<WhichResult>
  export default function which (command: string, options?: WhichOptions): Promise<string>
}
