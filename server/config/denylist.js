const parseCsvEnvList = (value) => {
    if (typeof value !== "string") {
        return [];
    }

    return value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
};
export const getReservedNames = () => Object.freeze([
    ...new Set([...parseCsvEnvList(process.env.RESERVED_USERNAMES)]),
]);

export const getBlockedTerms = () => Object.freeze([
    ...new Set([...parseCsvEnvList(process.env.BLOCKED_NAME_TERMS)]),
]);
