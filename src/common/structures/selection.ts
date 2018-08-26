import { Range as IRange, Position as IPosition } from "vscode-languageserver"

type Intersection = "none" | "below" | "above" | "lower" | "upper" | "full" | "contains";

export class Range implements IRange {
    public static parse(range: IRange | IPosition): Range {
        if (range == null) return null;
        if (range instanceof Range) return range;
        if ("line" in range && "character" in range) return Range.parse({ start: range, end: range });
        return new Range(Position.parse(range.start), Position.parse(range.end));
    }

    /**
     * Returns a value based on the kind of intersection
     * 
     * "none" = One or both of the values were null
     * 
     * "below" = @param target was fully below @param range
     * 
     * "above" = @param target was fully above @param range
     * 
     * "lower" = @param target overlaps with the bottom of @param range
     * 
     * "upper" = @param target overlaps with the top of @param range
     * 
     * "full" = @param target overlaps both the top and bottom of @param range
     * 
     * "contains" = @param target is contained within @param range
     * @param range The base range to use
     * @param target The range we are expecting to intersect with
     */
    public static getIntersection(range: IRange, target: IRange | IPosition): Intersection {
        if (range == null || target == null) return "none";

        target = Range.parse(target);
        let rStart = Position.parse(range.start),
            rEnd = Position.parse(range.end),
            tStart = Position.parse(target.start),
            tEnd = Position.parse(target.end);

        if (rStart == null || rEnd == null || tStart == null || tEnd == null) return "none";

        if (tStart.le(rStart)) {
            if (tEnd.le(rStart))
                return "below";
            if (tEnd.lt(rEnd))
                return "lower";
            return "full";
        }

        if (tEnd.ge(rEnd)) {
            if (tStart.ge(rEnd))
                return "above";
            if (tEnd.gt(rStart))
                return "upper";
            return "full";
        }

        return "contains";
    }

    public readonly start: Position;
    public readonly end: Position;

    constructor(start: Position, end: Position) {
        this.start = start;
        this.end = end;
    }

    public getIntersection(range: IRange | IPosition): Intersection {
        return Range.getIntersection(this, range);
    }
}

export class Position implements IPosition {
    public static parse(position: IPosition): Position {
        if (position == null) return null;
        if (position instanceof Position) return position;
        return new Position(position.line, position.character);
    }

    public static compare(pos1: IPosition, pos2: IPosition): number {
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

    public static lt(pos1: IPosition, pos2: IPosition): boolean { return Position.compare(pos1, pos2) < 0 }
    public static le(pos1: IPosition, pos2: IPosition): boolean { return Position.compare(pos1, pos2) <= 0 }
    public static gt(pos1: IPosition, pos2: IPosition): boolean { return Position.compare(pos1, pos2) > 0 }
    public static ge(pos1: IPosition, pos2: IPosition): boolean { return Position.compare(pos1, pos2) >= 0 }
    public static eq(pos1: IPosition, pos2: IPosition): boolean { return Position.compare(pos1, pos2) == 0 }
    public static ne(pos1: IPosition, pos2: IPosition): boolean { return Position.compare(pos1, pos2) != 0 }

    public readonly line: number;
    public readonly character: number;

    constructor(line: number, character: number) {
        this.line = line;
        this.character = character;
    }

    public compare(position: IPosition): number { return Position.compare(this, position); }
    public lt(position: IPosition): boolean { return Position.lt(this, position); }
    public le(position: IPosition): boolean { return Position.le(this, position); }
    public gt(position: IPosition): boolean { return Position.gt(this, position); }
    public ge(position: IPosition): boolean { return Position.ge(this, position); }
    public eq(position: IPosition): boolean { return Position.eq(this, position); }
    public ne(position: IPosition): boolean { return Position.ne(this, position); }
}

export { IRange, IPosition }