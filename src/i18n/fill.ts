/** Replace `{name}` placeholders. Missing keys become an empty string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] === undefined ? '' : String(values[key]),
  );
}
