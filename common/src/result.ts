import { Preconditions } from './preconditions.js';

export interface Result<F, S> {

    success(): boolean;

    failure(): boolean;

    getSuccess(): S;

    getFailure(): F;

    biMap<L, R>(successMapper: (value: S) => R, failureMapper: (value: F) => L): Result<L, R>;

    map<R>(mapper: (value: S) => R): Result<F, R>;

    mapFailure<L>(mapper: (value: F) => L): Result<L, S>;

    peek(successConsumer: (value: S) => void, failureConsumer: (value: F) => void): Result<F, S>;

    peekSuccess(successConsumer: (value: S) => void): Result<F, S>;

    peekFailure(failureConsumer: (value: F) => void): Result<F, S>;

    ifSuccessOrElse<R>(successMapping: (value: S) => R, failureMapping: (value: F) => R): R;

    flatMap<R>(mapping: (value: S) => Result<F, R>): Result<F, R>;

    fold<U>(leftMapper: (value: F) => U, rightMapper: (value: S) => U): U;

    combine<FAILURE, SUCCESS>(
        secondResult: Result<F, S>,
        failureCombiner: (first: F | null, second: F | null) => FAILURE,
        successCombiner: (first: S, second: S) => SUCCESS
    ): Result<FAILURE, SUCCESS>;
}

export class Success<F, S> implements Result<F, S> {

    private readonly _success: S;

    constructor(success: S) {
        this._success = success;
    }

    public success(): boolean {
        return true;
    }

    public failure(): boolean {
        return false;
    }

    public getSuccess(): S {
        return this._success;
    }

    public getFailure(): F {
        throw new Error('IllegalStateException');
    }

    public biMap<L, R>(successMapper: (value: S) => R, failureMapper: (value: F) => L): Result<L, R> {
        Preconditions.checkNotNull(successMapper, "successMapper cannot be null");
        Preconditions.checkNotNull(failureMapper, "failureMapper cannot be null");
        return new Success<L, R>(successMapper(this._success));
    }

    public map<R>(mapper: (value: S) => R): Result<F, R> {
        Preconditions.checkNotNull(mapper, "mapper cannot be null");
        return new Success<F, R>(mapper(this._success));
    }

    public mapFailure<L>(mapper: (value: F) => L): Result<L, S> {
        Preconditions.checkNotNull(mapper, "mapper cannot be null");
        return new Success<L, S>(this._success);
    }

    public peek(successConsumer: (value: S) => void, failureConsumer: (value: F) => void): Result<F, S> {
        Preconditions.checkNotNull(successConsumer, "successConsumer cannot be null");
        Preconditions.checkNotNull(failureConsumer, "failureConsumer cannot be null");
        successConsumer(this._success);
        return this;
    }

    public peekSuccess(successConsumer: (value: S) => void): Result<F, S> {
        Preconditions.checkNotNull(successConsumer, "successConsumer cannot be null");
        return this.peek(successConsumer, () => {});
    }

    public peekFailure(failureConsumer: (value: F) => void): Result<F, S> {
        Preconditions.checkNotNull(failureConsumer, "failureConsumer cannot be null");
        return this.peek(() => {}, failureConsumer);
    }

    public ifSuccessOrElse<R>(successMapping: (value: S) => R, failureMapping: (value: F) => R): R {
        Preconditions.checkNotNull(successMapping, "successMapping cannot be null");
        Preconditions.checkNotNull(failureMapping, "failureMapping cannot be null");
        return successMapping(this._success);
    }

    public flatMap<R>(mapping: (value: S) => Result<F, R>): Result<F, R> {
        Preconditions.checkNotNull(mapping, "mapping cannot be null");
        return mapping(this._success);
    }

    public fold<U>(leftMapper: (value: F) => U, rightMapper: (value: S) => U): U {
        Preconditions.checkNotNull(leftMapper, "leftMapper cannot be null");
        Preconditions.checkNotNull(rightMapper, "rightMapper cannot be null");
        return rightMapper(this._success);
    }

    public combine<FAILURE, SUCCESS>(
        secondResult: Result<F, S>,
        failureCombiner: (first: F | null, second: F | null) => FAILURE,
        successCombiner: (first: S, second: S) => SUCCESS
    ): Result<FAILURE, SUCCESS> {
        Preconditions.checkNotNull(secondResult, "secondResult cannot be null");
        Preconditions.checkNotNull(failureCombiner, "failureCombiner cannot be null");
        Preconditions.checkNotNull(successCombiner, "successCombiner cannot be null");
        if (secondResult.success()) {
            return new Success<FAILURE, SUCCESS>(successCombiner(this._success, secondResult.getSuccess()));
        } else {
            return new Failure<FAILURE, SUCCESS>(failureCombiner(null, secondResult.getFailure()));
        }
    }
}

export class Failure<F, S> implements Result<F, S> {

    private readonly _failure: F;

    constructor(failure: F) {
        this._failure = failure;
    }

    public success(): boolean {
        return false;
    }

    public failure(): boolean {
        return true;
    }

    public getSuccess(): S {
        throw new Error('IllegalStateException');
    }

    public getFailure(): F {
        return this._failure;
    }

    public biMap<L, R>(successMapper: (value: S) => R, failureMapper: (value: F) => L): Result<L, R> {
        Preconditions.checkNotNull(successMapper, "successMapper cannot be null");
        Preconditions.checkNotNull(failureMapper, "failureMapper cannot be null");
        return new Failure<L, R>(failureMapper(this._failure));
    }

    public map<R>(mapper: (value: S) => R): Result<F, R> {
        Preconditions.checkNotNull(mapper, "mapper cannot be null");
        return new Failure<F, R>(this._failure);
    }

    public mapFailure<L>(mapper: (value: F) => L): Result<L, S> {
        Preconditions.checkNotNull(mapper, "mapper cannot be null");
        return new Failure<L, S>(mapper(this._failure));
    }

    public peek(successConsumer: (value: S) => void, failureConsumer: (value: F) => void): Result<F, S> {
        Preconditions.checkNotNull(successConsumer, "successConsumer cannot be null");
        Preconditions.checkNotNull(failureConsumer, "failureConsumer cannot be null");
        failureConsumer(this._failure);
        return this;
    }

    public peekSuccess(successConsumer: (value: S) => void): Result<F, S> {
        Preconditions.checkNotNull(successConsumer, "successConsumer cannot be null");
        return this.peek(successConsumer, () => {});
    }

    public peekFailure(failureConsumer: (value: F) => void): Result<F, S> {
        Preconditions.checkNotNull(failureConsumer, "failureConsumer cannot be null");
        return this.peek(() => {}, failureConsumer);
    }

    public ifSuccessOrElse<R>(successMapping: (value: S) => R, failureMapping: (value: F) => R): R {
        Preconditions.checkNotNull(successMapping, "successMapping cannot be null");
        Preconditions.checkNotNull(failureMapping, "failureMapping cannot be null");
        return failureMapping(this._failure);
    }

    public flatMap<R>(mapping: (value: S) => Result<F, R>): Result<F, R> {
        Preconditions.checkNotNull(mapping, "mapping cannot be null");
        return this as unknown as Result<F, R>;
    }

    public fold<U>(leftMapper: (value: F) => U, rightMapper: (value: S) => U): U {
        Preconditions.checkNotNull(leftMapper, "leftMapper cannot be null");
        Preconditions.checkNotNull(rightMapper, "rightMapper cannot be null");
        return leftMapper(this._failure);
    }

    public combine<FAILURE, SUCCESS>(
        secondResult: Result<F, S>,
        failureCombiner: (first: F | null, second: F | null) => FAILURE,
        successCombiner: (first: S, second: S) => SUCCESS
    ): Result<FAILURE, SUCCESS> {
        Preconditions.checkNotNull(secondResult, "secondResult cannot be null");
        Preconditions.checkNotNull(failureCombiner, "failureCombiner cannot be null");
        Preconditions.checkNotNull(successCombiner, "successCombiner cannot be null");
        return new Failure<FAILURE, SUCCESS>(
            failureCombiner(this._failure, secondResult.failure() ? secondResult.getFailure() : null)
        );
    }
}

export class CompositeResult<F, S> {

    private readonly result: Result<F, S[]>;

    private constructor(result: Result<F, S[]>) {
        this.result = result;
    }

    public static fromList<F, S>(initialList: S[]): CompositeResult<F, S> {
        return new CompositeResult<F, S>(new Success<F, S[]>(initialList));
    }

    public static fromFailure<F, S>(failure: F): CompositeResult<F, S> {
        return new CompositeResult<F, S>(new Failure<F, S[]>(failure));
    }

    public accumulate(newResult: Result<F, S>): CompositeResult<F, S> {
        Preconditions.checkNotNull(newResult, "newResult cannot be null");
        if (this.result.failure()) {
            return this;
        }
        if (newResult.failure()) {
            return CompositeResult.fromFailure<F, S>(newResult.getFailure());
        }
        const accumulated: S[] = [...this.result.getSuccess(), newResult.getSuccess()];
        return new CompositeResult<F, S>(new Success<F, S[]>(accumulated));
    }

    public success(): boolean {
        return this.result.success();
    }

    public failure(): boolean {
        return this.result.failure();
    }

    public toResult(): Result<F, S[]> {
        return this.result;
    }
}

export class CompositeSetResult<F, S> {

    private readonly result: Result<F, Set<S>>;

    private constructor(result: Result<F, Set<S>>) {
        this.result = result;
    }

    public static fromSet<F, S>(initialSet: Set<S>): CompositeSetResult<F, S> {
        return new CompositeSetResult<F, S>(new Success<F, Set<S>>(initialSet));
    }

    public static fromFailure<F, S>(failure: F): CompositeSetResult<F, S> {
        return new CompositeSetResult<F, S>(new Failure<F, Set<S>>(failure));
    }

    public accumulate(newResult: Result<F, S>): CompositeSetResult<F, S> {
        Preconditions.checkNotNull(newResult, "newResult cannot be null");
        if (this.result.failure()) {
            return this;
        }
        if (newResult.failure()) {
            return CompositeSetResult.fromFailure<F, S>(newResult.getFailure());
        }
        const accumulated: Set<S> = new Set<S>(this.result.getSuccess());
        accumulated.add(newResult.getSuccess());
        return new CompositeSetResult<F, S>(new Success<F, Set<S>>(accumulated));
    }

    public success(): boolean {
        return this.result.success();
    }

    public failure(): boolean {
        return this.result.failure();
    }

    public toResult(): Result<F, Set<S>> {
        return this.result;
    }
}

// Static factory functions matching Java's Result.success(), Result.failure(), etc.
export const ResultFactory = {
    success<F, S>(value: S): Result<F, S> {
        return new Success<F, S>(value);
    },

    failure<F, S>(value: F): Result<F, S> {
        return new Failure<F, S>(value);
    },

    composite<F, S>(): CompositeResult<F, S> {
        return CompositeResult.fromList<F, S>([]);
    },

    compositeSet<F, S>(): CompositeSetResult<F, S> {
        return CompositeSetResult.fromSet<F, S>(new Set<S>());
    },
};
