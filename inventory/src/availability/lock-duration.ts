export interface LockDuration {
    isActive(now: Date, blockedAt: Date): boolean;
    isExpired(now: Date, blockedAt: Date): boolean;
}

export class IndefiniteLockDuration implements LockDuration {
    isActive(_now: Date, _blockedAt: Date): boolean {
        return true;
    }

    isExpired(_now: Date, _blockedAt: Date): boolean {
        return false;
    }
}

export class TimedLockDuration implements LockDuration {
    readonly durationMs: number;

    constructor(durationMs: number) {
        if (durationMs <= 0) {
            throw new Error('Duration must be positive');
        }
        this.durationMs = durationMs;
    }

    isActive(now: Date, blockedAt: Date): boolean {
        return now.getTime() < blockedAt.getTime() + this.durationMs;
    }

    isExpired(now: Date, blockedAt: Date): boolean {
        return !this.isActive(now, blockedAt);
    }
}

export const LockDurationFactory = {
    indefinite(): LockDuration {
        return new IndefiniteLockDuration();
    },

    of(durationMs: number): LockDuration {
        return new TimedLockDuration(durationMs);
    },

    ofMinutes(minutes: number): LockDuration {
        return new TimedLockDuration(minutes * 60 * 1000);
    },

    ofHours(hours: number): LockDuration {
        return new TimedLockDuration(hours * 60 * 60 * 1000);
    },

    ofDays(days: number): LockDuration {
        return new TimedLockDuration(days * 24 * 60 * 60 * 1000);
    },
};
