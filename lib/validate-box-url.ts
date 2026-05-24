const ALLOWED_BOX_DOMAINS = [
  'https://gehealthcare.box.com/',
  'https://app.box.com/',
]

export function isValidBoxUrl(url: string): boolean {
  return ALLOWED_BOX_DOMAINS.some((domain) => url.startsWith(domain))
}

export function assertValidBoxUrl(url: string): void {
  if (!isValidBoxUrl(url)) {
    throw new Error(
      'URL invalide. Le lien doit commencer par https://gehealthcare.box.com/ ou https://app.box.com/'
    )
  }
}
