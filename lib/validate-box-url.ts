const ALLOWED_BOX_DOMAINS = [
  'https://gevernova.box.com/',
  'https://gehealthcare.box.com/',
  'https://app.box.com/',
]

export function isValidBoxUrl(url: string): boolean {
  return ALLOWED_BOX_DOMAINS.some((domain) => url.startsWith(domain))
}

export function assertValidBoxUrl(url: string): void {
  if (!isValidBoxUrl(url)) {
    throw new Error(
      'URL invalide. Le lien doit commencer par https://gevernova.box.com/'
    )
  }
}
