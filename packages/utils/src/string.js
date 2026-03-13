export function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[\s_-]+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}
export function camelToSnake(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
export function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export function pluralize(word) {
    const irregulars = {
        person: "people",
        man: "men",
        child: "children",
        sex: "sexes",
        move: "moves",
        mouse: "mice",
    };
    if (irregulars[word])
        return irregulars[word];
    if (/(quiz)$/i.test(word))
        return word.replace(/$/i, "zes");
    if (/^(oxen)$/i.test(word))
        return word;
    if (/(m|l)ice$/i.test(word))
        return word;
    if (/(pe)ople$/i.test(word))
        return word;
    if (/(matr|vert|ind)ices$/i.test(word))
        return word;
    if (/(m|l)ouse$/i.test(word))
        return word.replace(/$/i, "ice");
    if (/(database)s$/i.test(word))
        return word;
    if (/s$/i.test(word))
        return word;
    if (/(ax|test)is$/i.test(word))
        return word + "es";
    if (/(octop|vir)us$/i.test(word))
        return word + "i";
    if (/(alias|radius)$/i.test(word))
        return word + "es";
    if (/(bu|shoe)s$/i.test(word))
        return word;
    if (/(buffal|tomat)o$/i.test(word))
        return word + "es";
    if (/([ti])um$/i.test(word))
        return word.replace(/um$/i, "a");
    if (/sis$/i.test(word))
        return word.replace(/sis$/i, "ses");
    if (/(?:([^f])fe|([lr])f)$/i.test(word))
        return word.replace(/f(e)?$/i, "ves");
    if (/(shea|lea|loa|thie)f$/i.test(word))
        return word + "ves";
    if (/gy$/.test(word))
        return word.replace(/y$/, "ies");
    if (/([^aeiouy]|qu)y$/i.test(word))
        return word.replace(/y$/i, "ies");
    if (/(x|ch|ss|sh)$/i.test(word))
        return word + "es";
    if (/([^s]+)(s)?$/i.test(word))
        return word + "s";
    return word + "s";
}
export function singularize(word) {
    if (word.endsWith("ies"))
        return word.slice(0, -3) + "y";
    if (word.endsWith("es"))
        return word.slice(0, -2);
    if (word.endsWith("s"))
        return word.slice(0, -1);
    return word;
}
export function truncate(str, length, suffix = "...") {
    if (str.length <= length)
        return str;
    return str.slice(0, length - suffix.length) + suffix;
}
//# sourceMappingURL=string.js.map