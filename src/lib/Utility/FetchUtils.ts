// https://fetch.spec.whatwg.org/#redirect-status
const redirectStatuses = [301, 302, 303, 307, 308];

export const isRedirect = (statusCode: number): boolean =>
    redirectStatuses.includes(statusCode);