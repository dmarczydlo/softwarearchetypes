import { describe, it, expect, vi } from 'vitest';
import { Result, Success, Failure, CompositeResult, CompositeSetResult, ResultFactory } from './result.js';

function randomAlphabetic(length: number): string {
    const chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result: string = '';
    for (let i: number = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function randomNumber(): number {
    return Math.floor(Math.random() * 1000);
}

describe('Result', () => {

    it('should be marked as success for success result', () => {
        expect(ResultFactory.success(randomAlphabetic(10)).success()).toBe(true);
    });

    it('should not be marked as failure for success result', () => {
        expect(ResultFactory.success(randomAlphabetic(10)).failure()).toBe(false);
    });

    it('should be marked as failure for failure result', () => {
        expect(ResultFactory.failure(randomAlphabetic(10)).failure()).toBe(true);
    });

    it('should not be marked as success for failure result', () => {
        expect(ResultFactory.failure(randomAlphabetic(10)).success()).toBe(false);
    });

    it('should fail to get success on failure result', () => {
        expect(() => ResultFactory.failure(randomAlphabetic(10)).getSuccess()).toThrow();
    });

    it('should fail to get failure on success result', () => {
        expect(() => ResultFactory.success(randomAlphabetic(10)).getFailure()).toThrow();
    });

    it('should choose and properly apply success mapping function', () => {
        const value: string = randomAlphabetic(10);

        const successMappingFunction = (val: string): string => "SUCCESS-" + val;
        const failureMappingFunction = (val: string): string => "FAILURE-" + val;

        const result: Result<string, string> = ResultFactory.success(value);

        expect(result.ifSuccessOrElse(successMappingFunction, failureMappingFunction)).toBe("SUCCESS-" + value);
    });

    it('should choose and properly apply failure mapping function', () => {
        const value: string = randomAlphabetic(10);

        const successMappingFunction = (val: string): string => "SUCCESS-" + val;
        const failureMappingFunction = (val: string): string => "FAILURE-" + val;

        const result: Result<string, string> = ResultFactory.failure(value);

        expect(result.ifSuccessOrElse(successMappingFunction, failureMappingFunction)).toBe("FAILURE-" + value);
    });

    it('should map success result according to mapping function', () => {
        const value: number = 1;

        const successMappingFunction = (val: number): string => String(val * 2);
        const failureMappingFunction = (val: number): string => "";

        const result: Result<number, number> = ResultFactory.success(value);

        expect(result.biMap(successMappingFunction, failureMappingFunction).getSuccess()).toBe("2");
    });

    it('should map failure result according to mapping function', () => {
        const value: number = 1;

        const successMappingFunction = (val: number): string => String(val * 2);
        const failureMappingFunction = (val: number): string => "";

        const result: Result<number, number> = ResultFactory.failure(value);

        expect(result.biMap(successMappingFunction, failureMappingFunction).getFailure()).toBe("");
    });

    it('should call success consumer on peek', () => {
        const value: number = randomNumber();
        const successConsumer = vi.fn();
        const failureConsumer = vi.fn();

        const result: Result<number, number> = ResultFactory.success(value);

        const peekResult: Result<number, number> = result.peek(successConsumer, failureConsumer);

        expect(peekResult).toBe(result);
        expect(successConsumer).toHaveBeenCalledTimes(1);
        expect(successConsumer).toHaveBeenCalledWith(value);
        expect(failureConsumer).toHaveBeenCalledTimes(0);
    });

    it('should call success consumer on peekSuccess', () => {
        const value: number = randomNumber();
        const successConsumer = vi.fn();
        const failureConsumer = vi.fn();

        const result: Result<number, number> = ResultFactory.success(value);

        const peekResult: Result<number, number> = result.peekSuccess(successConsumer).peekFailure(failureConsumer);

        expect(peekResult).toBe(result);
        expect(successConsumer).toHaveBeenCalledTimes(1);
        expect(successConsumer).toHaveBeenCalledWith(value);
        expect(failureConsumer).toHaveBeenCalledTimes(0);
    });

    it('should call failure consumer on peek', () => {
        const value: number = randomNumber();
        const successConsumer = vi.fn();
        const failureConsumer = vi.fn();

        const result: Result<number, number> = ResultFactory.failure(value);

        const peekResult: Result<number, number> = result.peek(successConsumer, failureConsumer);

        expect(peekResult).toBe(result);
        expect(successConsumer).toHaveBeenCalledTimes(0);
        expect(failureConsumer).toHaveBeenCalledTimes(1);
        expect(failureConsumer).toHaveBeenCalledWith(value);
    });

    it('should call failure consumer on peekFailure', () => {
        const value: number = randomNumber();
        const successConsumer = vi.fn();
        const failureConsumer = vi.fn();

        const result: Result<number, number> = ResultFactory.failure(value);

        const peekResult: Result<number, number> = result.peekSuccess(successConsumer).peekFailure(failureConsumer);

        expect(peekResult).toBe(result);
        expect(successConsumer).toHaveBeenCalledTimes(0);
        expect(failureConsumer).toHaveBeenCalledTimes(1);
        expect(failureConsumer).toHaveBeenCalledWith(value);
    });

    it('should combine two success results', () => {
        const firstValue: number = randomNumber();
        const secondValue: number = randomNumber();

        const firstResult: Result<number, number> = ResultFactory.success(firstValue);
        const secondResult: Result<number, number> = ResultFactory.success(secondValue);

        const successCombiner = (val1: number, val2: number): number => val1 + val2;
        const failureCombiner = (val1: number | null, val2: number | null): number => (val1 ?? 0) - (val2 ?? 0);

        const combinedResult: Result<number, number> = firstResult.combine(secondResult, failureCombiner, successCombiner);

        expect(combinedResult.getSuccess()).toBe(firstValue + secondValue);
    });

    it('should combine two failure results', () => {
        const firstValue: number = randomNumber();
        const secondValue: number = randomNumber();

        const firstResult: Result<number, number> = ResultFactory.failure(firstValue);
        const secondResult: Result<number, number> = ResultFactory.failure(secondValue);

        const successCombiner = (val1: number, val2: number): number => val1 + val2;
        const failureCombiner = (val1: number | null, val2: number | null): number => (val1 ?? 0) - (val2 ?? 0);

        const combinedResult: Result<number, number> = firstResult.combine(secondResult, failureCombiner, successCombiner);

        expect(combinedResult.getFailure()).toBe(firstValue - secondValue);
    });

    it('should produce failure result when combining failure and success results', () => {
        const firstValue: number = randomNumber();
        const secondValue: number = randomNumber();

        const firstResult: Result<number, number> = ResultFactory.success(firstValue);
        const secondResult: Result<number, number> = ResultFactory.failure(secondValue);

        const successCombiner = (val1: number, val2: number): number => val1 + val2;
        const failureCombiner = (val1: number | null, val2: number | null): number => (val1 ?? 0) - (val2 ?? 0);

        const successFailureCombinedResult: Result<number, number> = firstResult.combine(secondResult, failureCombiner, successCombiner);
        expect(successFailureCombinedResult.getFailure()).toBe(-secondValue);

        const failureSuccessCombinedResult: Result<number, number> = secondResult.combine(firstResult, failureCombiner, successCombiner);
        expect(failureSuccessCombinedResult.getFailure()).toBe(secondValue);
    });

    it('should map success value using map function', () => {
        const value: number = 10;
        const mapper = (val: number): string => "Value: " + (val * 2);

        const result: Result<string, string> = ResultFactory.success<string, number>(value).map(mapper);

        expect(result.success()).toBe(true);
        expect(result.getSuccess()).toBe("Value: 20");
    });

    it('should not map failure value using map function', () => {
        const errorMessage: string = "Error occurred";
        const mapper = (val: number): string => "Value: " + (val * 2);

        const result: Result<string, string> = ResultFactory.failure<string, number>(errorMessage).map(mapper);

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe(errorMessage);
    });

    it('should throw error when map with null mapper', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.map(null as unknown as (value: number) => string)).toThrow();
    });

    it('should map failure value using mapFailure function', () => {
        const errorCode: number = 404;
        const mapper = (code: number): string => "Error " + code + ": Not Found";

        const result: Result<string, number> = ResultFactory.failure<number, number>(errorCode).mapFailure(mapper);

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe("Error 404: Not Found");
    });

    it('should not map success value using mapFailure function', () => {
        const value: number = 42;
        const mapper = (code: number): string => "Error " + code;

        const result: Result<string, number> = ResultFactory.success<number, number>(value).mapFailure(mapper);

        expect(result.success()).toBe(true);
        expect(result.getSuccess()).toBe(value);
    });

    it('should throw error when mapFailure with null mapper', () => {
        const result: Result<string, number> = ResultFactory.failure("error");

        expect(() => result.mapFailure(null as unknown as (value: string) => string)).toThrow();
    });

    it('should flatMap success result with another success result', () => {
        const value: number = 5;
        const mapper = (val: number): Result<string, number> => ResultFactory.success(val * 2);

        const result: Result<string, number> = ResultFactory.success<string, number>(value).flatMap(mapper);

        expect(result.success()).toBe(true);
        expect(result.getSuccess()).toBe(10);
    });

    it('should flatMap success result with failure result', () => {
        const value: number = 5;
        const errorMessage: string = "Validation failed";
        const mapper = (_val: number): Result<string, number> => ResultFactory.failure(errorMessage);

        const result: Result<string, number> = ResultFactory.success<string, number>(value).flatMap(mapper);

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe(errorMessage);
    });

    it('should not flatMap failure result', () => {
        const errorMessage: string = "Initial error";
        const mapper = (val: number): Result<string, number> => ResultFactory.success(val * 2);

        const result: Result<string, number> = ResultFactory.failure<string, number>(errorMessage).flatMap(mapper);

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe(errorMessage);
    });

    it('should throw error when flatMap with null mapper', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.flatMap(null as unknown as (value: number) => Result<string, number>)).toThrow();
    });

    it('should fold success result using right mapper', () => {
        const value: number = 10;
        const leftMapper = (_error: string): number => -1;
        const rightMapper = (val: number): number => val * 3;

        const folded: number = ResultFactory.success<string, number>(value).fold(leftMapper, rightMapper);

        expect(folded).toBe(30);
    });

    it('should fold failure result using left mapper', () => {
        const errorMessage: string = "Error";
        const leftMapper = (error: string): number => error.length;
        const rightMapper = (val: number): number => val * 3;

        const folded: number = ResultFactory.failure<string, number>(errorMessage).fold(leftMapper, rightMapper);

        expect(folded).toBe(5);
    });

    it('should throw error when folding with null left mapper', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.fold(null as unknown as (value: string) => number, (val: number) => val * 2)).toThrow();
    });

    it('should throw error when folding with null right mapper', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.fold((_error: string) => -1, null as unknown as (value: number) => number)).toThrow();
    });

    it('should throw error when biMap with null success mapper', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.biMap(null as unknown as (value: number) => string, (_error: string) => "")).toThrow();
    });

    it('should throw error when biMap with null failure mapper', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.biMap((_val: number) => "", null as unknown as (value: string) => string)).toThrow();
    });

    it('should throw error when ifSuccessOrElse with null success mapping', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.ifSuccessOrElse(null as unknown as (value: number) => string, (_error: string) => "")).toThrow();
    });

    it('should throw error when ifSuccessOrElse with null failure mapping', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.ifSuccessOrElse((_val: number) => "", null as unknown as (value: string) => string)).toThrow();
    });

    it('should throw error when peek with null success consumer', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.peek(null as unknown as (value: number) => void, (_error: string) => {})).toThrow();
    });

    it('should throw error when peek with null failure consumer', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.peek((_val: number) => {}, null as unknown as (value: string) => void)).toThrow();
    });

    it('should throw error when peekSuccess with null consumer', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.peekSuccess(null as unknown as (value: number) => void)).toThrow();
    });

    it('should throw error when peekFailure with null consumer', () => {
        const result: Result<string, number> = ResultFactory.failure("error");

        expect(() => result.peekFailure(null as unknown as (value: string) => void)).toThrow();
    });

    it('should throw error when combine with null second result', () => {
        const result: Result<string, number> = ResultFactory.success(10);

        expect(() => result.combine(
            null as unknown as Result<string, number>,
            (f1: string | null, f2: string | null) => "",
            (s1: number, s2: number) => 0
        )).toThrow();
    });

    it('should throw error when combine with null failure combiner', () => {
        const firstResult: Result<string, number> = ResultFactory.success(10);
        const secondResult: Result<string, number> = ResultFactory.success(20);

        expect(() => firstResult.combine(
            secondResult,
            null as unknown as (f1: string | null, f2: string | null) => string,
            (s1: number, s2: number) => s1 + s2
        )).toThrow();
    });

    it('should throw error when combine with null success combiner', () => {
        const firstResult: Result<string, number> = ResultFactory.success(10);
        const secondResult: Result<string, number> = ResultFactory.success(20);

        expect(() => firstResult.combine(
            secondResult,
            (f1: string | null, f2: string | null) => "",
            null as unknown as (s1: number, s2: number) => number
        )).toThrow();
    });
});

describe('CompositeResult', () => {

    it('should create empty composite result', () => {
        const composite: CompositeResult<string, number> = ResultFactory.composite();
        const result: Result<string, number[]> = composite.toResult();

        expect(result.success()).toBe(true);
        expect(result.getSuccess()).toEqual([]);
    });

    it('should accumulate success results into list', () => {
        const composite: CompositeResult<string, number> = ResultFactory.composite();

        const result: Result<string, number[]> = composite
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.success(2))
            .accumulate(ResultFactory.success(3))
            .toResult();

        expect(result.success()).toBe(true);
        expect(result.getSuccess()).toEqual([1, 2, 3]);
    });

    it('should stop accumulating on first failure', () => {
        const composite: CompositeResult<string, number> = ResultFactory.composite();

        const result: Result<string, number[]> = composite
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.failure("Error occurred"))
            .accumulate(ResultFactory.success(3))
            .toResult();

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe("Error occurred");
    });

    it('should retain failure when accumulating to failed composite', () => {
        const composite: CompositeResult<string, number> = ResultFactory.composite<string, number>()
            .accumulate(ResultFactory.failure("First error"));

        const result: Result<string, number[]> = composite
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.success(2))
            .toResult();

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe("First error");
    });

    it('should throw error when accumulate with null', () => {
        const composite: CompositeResult<string, number> = ResultFactory.composite();

        expect(() => composite.accumulate(null as unknown as Result<string, number>)).toThrow();
    });

    it('should return true for success on composite result', () => {
        const composite: CompositeResult<string, number> = ResultFactory.composite<string, number>()
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.success(2));

        expect(composite.success()).toBe(true);
        expect(composite.failure()).toBe(false);
    });

    it('should return true for failure on composite result', () => {
        const composite: CompositeResult<string, number> = ResultFactory.composite<string, number>()
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.failure("Error"));

        expect(composite.failure()).toBe(true);
        expect(composite.success()).toBe(false);
    });
});

describe('CompositeSetResult', () => {

    it('should create empty composite set result', () => {
        const composite: CompositeSetResult<string, number> = ResultFactory.compositeSet();
        const result: Result<string, Set<number>> = composite.toResult();

        expect(result.success()).toBe(true);
        expect(result.getSuccess().size).toBe(0);
    });

    it('should accumulate success results into set', () => {
        const composite: CompositeSetResult<string, number> = ResultFactory.compositeSet();

        const result: Result<string, Set<number>> = composite
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.success(2))
            .accumulate(ResultFactory.success(3))
            .toResult();

        expect(result.success()).toBe(true);
        expect(result.getSuccess()).toEqual(new Set([1, 2, 3]));
    });

    it('should stop accumulating to set on first failure', () => {
        const composite: CompositeSetResult<string, number> = ResultFactory.compositeSet();

        const result: Result<string, Set<number>> = composite
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.failure("Error occurred"))
            .accumulate(ResultFactory.success(3))
            .toResult();

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe("Error occurred");
    });

    it('should retain failure when accumulating to set to failed composite', () => {
        const composite: CompositeSetResult<string, number> = ResultFactory.compositeSet<string, number>()
            .accumulate(ResultFactory.failure("First error"));

        const result: Result<string, Set<number>> = composite
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.success(2))
            .toResult();

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe("First error");
    });

    it('should accumulate to set removing duplicates', () => {
        const composite: CompositeSetResult<string, number> = ResultFactory.compositeSet();

        const result: Result<string, Set<number>> = composite
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.success(2))
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.success(3))
            .toResult();

        expect(result.success()).toBe(true);
        expect(result.getSuccess()).toEqual(new Set([1, 2, 3]));
    });

    it('should throw error when accumulate to set with null', () => {
        const composite: CompositeSetResult<string, number> = ResultFactory.compositeSet();

        expect(() => composite.accumulate(null as unknown as Result<string, number>)).toThrow();
    });

    it('should return true for success on composite set result', () => {
        const composite: CompositeSetResult<string, number> = ResultFactory.compositeSet<string, number>()
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.success(2));

        expect(composite.success()).toBe(true);
        expect(composite.failure()).toBe(false);
    });

    it('should return true for failure on composite set result', () => {
        const composite: CompositeSetResult<string, number> = ResultFactory.compositeSet<string, number>()
            .accumulate(ResultFactory.success(1))
            .accumulate(ResultFactory.failure("Error"));

        expect(composite.failure()).toBe(true);
        expect(composite.success()).toBe(false);
    });
});
