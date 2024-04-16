export function isGone(key: string, oldProps: any): boolean {
  return !(key in oldProps)
}

export const isNew = (oldProps: any, newProps: any) => (key: string): boolean => oldProps[key] != newProps[key]

export function isEvent(key: string): boolean {
  return key.startsWith('on')
}

export function isProperty(key: string): boolean {
  return key !== 'children' && !isEvent(key)
}