import { Range as IRange, Position as IPosition } from 'vscode-languageserver/lib/main'

export class Range implements IRange {
    public static contains(range1: IRange, range2: IRange | IPosition, includeLower: boolean = true, includeUpper: boolean = false): boolean {
        console.log("Does", range1, "contain", range2);
        if (range1 == null || range2 == null) return false;

        if ('line' in range2 && 'character' in range2) 
            range2 = { start: range2, end: range2 };

        let lowerComp = Position.compare(range1.start, range2.start)
        console.log(lowerComp);
        if (includeLower ? lowerComp < 0 : lowerComp <= 0)
            return false;

        let upperComp = Position.compare(range1.end, range2.end);
        console.log(upperComp);
        if (includeUpper ? upperComp > 0 : upperComp >= 0) 
            return false;

        return true;
    }

    public readonly start: IPosition;
    public readonly end: IPosition;

    constructor(start: IPosition, end: IPosition) {
        this.start = start;
        this.end = end;
    }

    public contains(range: IRange | IPosition, includeLower: boolean = true, includeUpper: boolean = false): boolean{
        return Range.contains(this, range, includeLower, includeUpper);
    }
}

export class Position implements IPosition {
    public static compare(pos1: IPosition, pos2: IPosition) {
        console.log("Compare", pos1, "to", pos2);

        if (pos1 == pos2) return 0;
        if (pos1 == null) return 1;
        if (pos2 == null) return -1;

        if (pos1.character == pos2.character && pos1.line == pos2.line)
            return 0;

        let lineComp = pos1.line - pos2.line;
        if (lineComp != 0) return lineComp;

        //Must be same line
        return pos1.character - pos2.character;
    }

    public readonly line: number;
    public readonly character: number;

    constructor (line: number, character: number){ 
        this.line = line,
        this.character = character;
    }

    public compare(position: IPosition) {
        return Position.compare(this, position);
    }
}

export { IRange, IPosition };