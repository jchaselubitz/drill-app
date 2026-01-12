// Type declarations to bridge TypeScript 5.9 decorator types with WatermelonDB legacy decorators
// This file suppresses TypeScript 5.9's new decorator API type checking for WatermelonDB decorators
// which use the legacy decorator format (experimentalDecorators: true)

declare module '@nozbe/watermelondb/decorators' {
  // Use 'any' return type to bypass TypeScript 5.9's new decorator API type checking
  // WatermelonDB uses legacy decorators which work at runtime with Babel
  export function field(columnName: string): any;
  export function relation(tableName: string, foreignKey: string): any;
  export function children(tableName: string): any;
  export function writer(
    target: any,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor
  ): any;
}
