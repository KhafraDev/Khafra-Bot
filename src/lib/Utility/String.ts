export const upperCase = <T extends string>(s: T) => 
    `${s.charAt(0).toUpperCase()}${s.slice(1).toLowerCase()}` as Capitalize<T>;