export enum CmpOp {
    GT = "GT",
    GTE = "GTE",
    LT = "LT",
    LTE = "LTE",
    EQ = "EQ",
}

export function cmpOpCompare(op: CmpOp, left: number, right: number): boolean {
    switch (op) {
        case CmpOp.GT: return left > right;
        case CmpOp.GTE: return left >= right;
        case CmpOp.LT: return left < right;
        case CmpOp.LTE: return left <= right;
        case CmpOp.EQ: return left === right;
    }
}
