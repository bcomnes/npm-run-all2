declare module 'read-package-json-fast' {
  type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

  export interface PackageJson {
    name?: string
    version?: string
    scripts?: Record<string, string>
    [key: string]: JsonValue | undefined
  }

  export default function readPackageJsonFast (path: string): Promise<PackageJson>
}
