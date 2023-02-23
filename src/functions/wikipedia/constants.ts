export const routes = {
  wikimedia: 'https://api.wikimedia.org/core/v1/wikipedia/en/search/page?',
  wikipedia: 'https://en.wikipedia.org/w/api.php?'
} as const

export const defaultRequestOptions = {
  headers: {
    'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot)'
  }
} as const
