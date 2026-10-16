export function storeLinkIssue(value: string): string | null {
  const slug = value.trim();
  return slug.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ? null : 'Use lowercase letters, numbers and hyphens, up to 100 characters.';
}

export function ussdCodeIssue(value: string): string | null {
  const code = value.trim();
  return code.length <= 20 && /^(?:[0-9]+|\*[0-9]+(?:\*[0-9]+)*#)$/.test(code)
    ? null : 'Enter a short code such as 115 or a complete dial code such as *111*1*1# (up to 20 characters).';
}
