import { PhysicsProcess } from './PhysicsProcess.js';
import { Laboratory } from './Laboratory.js';

export class InfluenceUnit {
    readonly process: PhysicsProcess;
    readonly laboratory: Laboratory;

    constructor(process: PhysicsProcess, laboratory: Laboratory) {
        this.process = process;
        this.laboratory = laboratory;
    }

    key(): string {
        return `${this.process.name}|${this.laboratory.name}`;
    }

    equals(other: InfluenceUnit): boolean {
        return this.process.name === other.process.name && this.laboratory.name === other.laboratory.name;
    }
}
