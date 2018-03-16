import * as fs from "fs";
import * as path from "path";

declare global {
    interface Console {
        logLevel: LogLevel,
        critical(...content: any[]): void;
        warning(...content: any[]): void;
        verbose(...content: any[]): void;
        debug(...content: any[]): void;
    }

    interface Number {
        between(lower: number, upper: number, includeLower?: boolean, includeUpper?: boolean): boolean;
    }

    interface String {
        reverse(): string;
        similarity(other: string): number
    }

    interface JSON {
        parseSafe<TResult = any>(text: string, reviver?: (key: any, value: any) => any): { success: true, result: TResult } | { success: false, result: Error };
    }
}

export function requireFolder(folder: string, mapper?: (file: string) => string): { [module: string]: any } {
    let files = fs.readdirSync(path.join(__dirname, folder));
    if (files == null) return undefined;

    mapper = mapper || (f => f.split(".")[0]);

    let fileNames = files.map(f => path.basename(f)).map(mapper);
    console.debug(files, fileNames);
    let result: { [key: string]: any } = {};
    for (const file of new Set(fileNames)) {
        result[file] = require(path.join(__dirname, folder, file));
    }

    return result;
}

export enum LogLevel {
    "critical",
    "error",
    "warning",
    "info",
    "verbose",
    "debug"
}

const oldLog = console.log;
function conditionalLog(level: LogLevel, prefix: string) {
    return function log(...content: any[]) {
        if (isNaN(level) || console.logLevel >= level)
            oldLog(prefix, ...content);
    }
}

console.log = conditionalLog(NaN, "[Log]");
console.critical = conditionalLog(LogLevel.critical, "[Critical]");
console.error = conditionalLog(LogLevel.error, "[Error]");
console.warning = conditionalLog(LogLevel.warning, "[Warning]");
console.info = conditionalLog(LogLevel.info, "[Info]");
console.verbose = conditionalLog(LogLevel.verbose, "[Verbose]");
console.debug = conditionalLog(LogLevel.debug, "[Debug]");

Number.prototype.between =
    function between(lower: number, upper: number, includeLower: boolean = true, includeUpper: boolean = false): boolean {
        return (includeLower ? this >= lower : this > lower) &&
            (includeUpper ? this <= upper : this < upper);
    }

String.prototype.reverse = function reverse() { return this.split("").reverse().join(""); }
String.prototype.similarity = function similarity(this: string, other: string) {
    let position = this.indexOf(other);
    if (position == -1) return 0;
    return (other.length - Math.pow(position, 2)) / other.length;
}

JSON.parseSafe = function (text, reviver) {
    try {
        return { success: true, result: JSON.parse(text, reviver) };
    } catch (error) {
        return { success: false, result: error };
    }
}