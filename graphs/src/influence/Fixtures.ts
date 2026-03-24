import { PhysicsProcess } from './PhysicsProcess.js';
import { Laboratory } from './Laboratory.js';
import { InfrastructureInfluence } from './InfrastructureInfluence.js';

export const THERMAL = new PhysicsProcess('thermal');
export const CONDUCTIVITY = new PhysicsProcess('conductivity');
export const SPECTROSCOPY = new PhysicsProcess('spectroscopy');

export const LAB_A = new Laboratory('Lab A');
export const LAB_B = new Laboratory('Lab B');
export const LAB_C = new Laboratory('Lab C');

export function emptyInfrastructure(): InfrastructureInfluence {
    return InfrastructureInfluence.builder().build();
}
