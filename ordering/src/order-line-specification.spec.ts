import { describe, it, expect } from 'vitest';
import { OrderLineSpecification } from './order-line-specification.js';

describe('OrderLineSpecification', () => {
    it('features should return only plain attributes', () => {
        const spec = OrderLineSpecification.of({
            "color": "black",
            "size": "XL",
            "component.cpu": "i7",
            "_warehouse": "warsaw"
        });

        const features = spec.features();

        expect(features.size).toBe(2);
        expect(features.get("color")).toBe("black");
        expect(features.get("size")).toBe("XL");
    });

    it('components should return component entries with prefix stripped', () => {
        const spec = OrderLineSpecification.of({
            "component.laptop": "Dell-5540",
            "component.mouse": "Logitech-MX3",
            "color": "black"
        });

        const components = spec.components();

        expect(components.size).toBe(2);
        expect(components.get("laptop")).toBe("Dell-5540");
        expect(components.get("mouse")).toBe("Logitech-MX3");
    });

    it('preferences should return underscore-prefixed entries with prefix stripped', () => {
        const spec = OrderLineSpecification.of({
            "_warehouse": "warsaw-central",
            "_deliveryDate": "2025-01-16",
            "color": "blue"
        });

        const preferences = spec.preferences();

        expect(preferences.size).toBe(2);
        expect(preferences.get("warehouse")).toBe("warsaw-central");
        expect(preferences.get("deliveryDate")).toBe("2025-01-16");
    });

    it('mixed attributes should be correctly separated', () => {
        const spec = OrderLineSpecification.of({
            "color": "black",
            "component.cpu": "i7",
            "_warehouse": "warsaw"
        });

        expect(spec.features().size).toBe(1);
        expect(spec.components().size).toBe(1);
        expect(spec.preferences().size).toBe(1);
    });

    it('component features should be excluded from plain features', () => {
        const spec = OrderLineSpecification.of({
            "laptop.color": "black",
            "ram": "16GB"
        });

        const features = spec.features();

        expect(features.size).toBe(1);
        expect(features.get("ram")).toBe("16GB");
        expect(features.has("laptop.color")).toBe(false);
    });

    it('with should create new spec with added attribute', () => {
        const original = OrderLineSpecification.of("color", "black");

        const updated = original.with("size", "XL");

        expect(updated.get("color")).toBe("black");
        expect(updated.get("size")).toBe("XL");
        expect(original.has("size")).toBe(false);
    });

    it('get should return null for missing key', () => {
        const spec = OrderLineSpecification.of("color", "black");

        expect(spec.get("color")).toBe("black");
        expect(spec.get("missing")).toBeNull();
    });

    it('has should check key presence', () => {
        const spec = OrderLineSpecification.of("color", "black");

        expect(spec.has("color")).toBe(true);
        expect(spec.has("missing")).toBe(false);
    });

    it('empty should have no attributes', () => {
        const spec = OrderLineSpecification.empty();

        expect(spec.attributes().size).toBe(0);
        expect(spec.features().size).toBe(0);
        expect(spec.components().size).toBe(0);
        expect(spec.preferences().size).toBe(0);
    });
});
