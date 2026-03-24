import { describe, it, expect, beforeEach } from "vitest";
import { Money } from "@softwarearchetypes/quantity";
import { PricingConfiguration } from "./PricingConfiguration.js";
import { PricingFacade } from "./PricingFacade.js";
import { CalculatorType } from "./CalculatorType.js";
import { Interpretation } from "./Interpretation.js";
import { Parameters } from "./Parameters.js";
import { ValueOf, SumOf } from "./ParameterValue.js";
import { Validity } from "./Validity.js";
import { NumericRange } from "./CalculatorRange.js";
import { equalsTo, lessThan, greaterThanOrEqualTo } from "./ApplicabilityConstraint.js";

function date(y: number, m: number, d: number, h = 0, min = 0): Date {
    return new Date(y, m - 1, d, h, min);
}

const NOW = date(2025, 1, 15, 12, 50);

describe("BankingComponentScenario", () => {
    let facade: PricingFacade;

    beforeEach(() => {
        facade = PricingConfiguration.inMemory(NOW).pricingFacade();

        facade.addCalculator("loan-interest", CalculatorType.SIMPLE_INTEREST, Parameters.of("annualRate", 5.5));
        facade.addCalculator("insurance-rate", CalculatorType.PERCENTAGE, Parameters.of("percentageRate", 2));
        facade.addCalculator("processing-fee", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(500)));
        facade.addCalculator("monthly-account-fee", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(15)));
        facade.addCalculator("transaction-fee", CalculatorType.STEP_FUNCTION, Parameters.of("basePrice", Money.pln(0), "stepSize", 1, "stepIncrement", 0.50));
        facade.addCalculator("management-fee", CalculatorType.PERCENTAGE, Parameters.of("percentageRate", 1.5));
        facade.addCalculator("performance-fee", CalculatorType.PERCENTAGE, Parameters.of("percentageRate", 20));
    });

    it("should calculate loan cost with insurance dependency", () => {
        facade.createSimpleComponent("principal-interest", "loan-interest");
        facade.createSimpleComponent("loan-insurance", "insurance-rate");
        facade.createSimpleComponent("processing", "processing-fee");

        facade.createCompositeComponent("loan-base", new Map(), "principal-interest", "processing");
        facade.createCompositeComponent("total-loan-cost",
            new Map([["loan-insurance", new Map([["baseAmount", new ValueOf("loan-base")]])]]),
            "loan-base", "loan-insurance"
        );

        const loanParams = Parameters.of("base", Money.pln(100000), "unit", "YEARS");
        const result = facade.calculateComponent("total-loan-cost", loanParams);

        // interest=5500, processing=500, loan-base=6000, insurance=120, total=6120
        expect(result.equals(Money.pln(6120))).toBe(true);
    });

    it("should calculate account fees with transactions", () => {
        facade.createSimpleComponent("monthly-fee", "monthly-account-fee");
        facade.createSimpleComponent("transaction-fees", "transaction-fee");

        facade.createCompositeComponent("total-account-fees", new Map(), "monthly-fee", "transaction-fees");

        const accountParams = Parameters.of("quantity", 50);
        const result = facade.calculateComponent("total-account-fees", accountParams);
        // 15 + 25 = 40
        expect(result.equals(Money.pln(40))).toBe(true);
    });

    it("should calculate portfolio fees with performance bonus", () => {
        facade.createSimpleComponent("base-management", "management-fee");
        facade.createSimpleComponent("performance-bonus", "performance-fee");

        facade.createCompositeComponent("total-management-fees",
            new Map([["performance-bonus", new Map([["baseAmount", new ValueOf("base-management")]])]]),
            "base-management", "performance-bonus"
        );

        const portfolioParams = Parameters.of("baseAmount", Money.pln(1000000));
        const result = facade.calculateComponent("total-management-fees", portfolioParams);
        // base=15000, performance=3000, total=18000
        expect(result.equals(Money.pln(18000))).toBe(true);
    });
});

describe("PricingFacadeAdapters", () => {
    let facade: PricingFacade;

    beforeEach(() => {
        facade = PricingConfiguration.inMemory(NOW).pricingFacade();
    });

    it("calculateTotal should return directly if calculator returns total", () => {
        facade.addCalculator("total-calc", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(150)));
        const total = facade.calculateTotal("total-calc", Parameters.empty());
        expect(total.equals(Money.pln(150))).toBe(true);
    });

    it("calculateTotal should wrap unit price calculator", () => {
        facade.addCalculator("unit-calc", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(10), "interpretation", Interpretation.UNIT));
        const total = facade.calculateTotal("unit-calc", Parameters.of("quantity", 15));
        expect(total.equals(Money.pln(150))).toBe(true);
    });

    it("calculateUnitPrice should wrap total price calculator", () => {
        facade.addCalculator("step-calc", CalculatorType.STEP_FUNCTION, Parameters.of("basePrice", Money.pln(100), "stepSize", 10, "stepIncrement", 5));
        const unit = facade.calculateUnitPrice("step-calc", Parameters.of("quantity", 15));
        expect(unit.equals(Money.pln(7))).toBe(true);
    });

    it("calculateMarginal should wrap total price calculator", () => {
        facade.addCalculator("step-calc", CalculatorType.STEP_FUNCTION, Parameters.of("basePrice", Money.pln(100), "stepSize", 1, "stepIncrement", 5));
        const marginal = facade.calculateMarginal("step-calc", Parameters.of("quantity", 11));
        expect(marginal.equals(Money.pln(5))).toBe(true);
    });

    it("should not allow creating adapters directly", () => {
        expect(() => facade.addCalculator("adapter", CalculatorType.UNIT_TO_TOTAL_ADAPTER, Parameters.empty()))
            .toThrow("cannot be created directly");
    });
});

describe("BankAccountFeeScenario", () => {
    let facade: PricingFacade;

    beforeEach(() => {
        facade = PricingConfiguration.inMemory(NOW).pricingFacade();

        const feeTier1 = facade.addCalculator("acc-fee-tier-1", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(20)));
        const feeTier2 = facade.addCalculator("acc-fee-tier-2", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(10)));
        const feeTier3 = facade.addCalculator("acc-fee-tier-3", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(0)));

        const ranges = [
            new NumericRange(0, 1000, feeTier1.getId()),
            new NumericRange(1000, 4000, feeTier2.getId()),
            new NumericRange(4000, 2147483647, feeTier3.getId()),
        ];

        facade.addCalculator("account-fee", CalculatorType.COMPOSITE,
            Parameters.of("rangeSelector", "monthlyIncome", "ranges", ranges)
        );
    });

    it("should charge 20 PLN for low income", () => {
        const fee = facade.calculate("account-fee", Parameters.of("monthlyIncome", 500));
        expect(fee.value()).toBe(20);
    });

    it("should charge 10 PLN for medium income", () => {
        const fee = facade.calculate("account-fee", Parameters.of("monthlyIncome", 2500));
        expect(fee.value()).toBe(10);
    });

    it("should charge nothing for high income", () => {
        const fee = facade.calculate("account-fee", Parameters.of("monthlyIncome", 5000));
        expect(fee.value()).toBe(0);
    });
});

describe("CompositeComponentApplicability", () => {
    let facade: PricingFacade;

    beforeEach(() => {
        facade = PricingConfiguration.inMemory(NOW).pricingFacade();
        facade.addCalculator("fixed-100", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(100)));
        facade.addCalculator("fixed-50", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(50)));
        facade.addCalculator("fixed-30", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(30)));
        facade.addCalculator("fixed-20", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(20)));
    });

    it("should return zero for composite when constraint not satisfied", () => {
        facade.createSimpleComponent("base-fee", "fixed-100");
        facade.createSimpleComponent("premium-feature", "fixed-50");
        facade.createSimpleComponent("loyalty-bonus", "fixed-30");

        facade.createCompositeComponent("premium-bundle", new Map(), equalsTo("customer-type", "premium"), "premium-feature", "loyalty-bonus");
        facade.createCompositeComponent("total", new Map(), "base-fee", "premium-bundle");

        expect(facade.calculateComponent("total", Parameters.of("customer-type", "standard")).equals(Money.pln(100))).toBe(true);
        expect(facade.calculateComponent("total", Parameters.of("customer-type", "premium")).equals(Money.pln(180))).toBe(true);
    });

    it("should select correct composite based on numeric constraint", () => {
        facade.createSimpleComponent("light-fee", "fixed-20");
        facade.createSimpleComponent("heavy-fee", "fixed-50");

        facade.createCompositeComponent("light-delivery", new Map(), lessThan("weight", 5), "light-fee");
        facade.createCompositeComponent("heavy-delivery", new Map(), greaterThanOrEqualTo("weight", 5), "heavy-fee");
        facade.createCompositeComponent("delivery-cost", new Map(), "light-delivery", "heavy-delivery");

        expect(facade.calculateComponent("delivery-cost", Parameters.of("weight", 3)).equals(Money.pln(20))).toBe(true);
        expect(facade.calculateComponent("delivery-cost", Parameters.of("weight", 10)).equals(Money.pln(50))).toBe(true);
    });
});

describe("TelcoComponentScenario", () => {
    let facade: PricingFacade;

    beforeEach(() => {
        facade = PricingConfiguration.inMemory(NOW).pricingFacade();
        facade.addCalculator("network-maintenance", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(25)));
        facade.addCalculator("commission", CalculatorType.SIMPLE_FIXED, Parameters.of("amount", Money.pln(20)));
        facade.addCalculator("data-overage", CalculatorType.STEP_FUNCTION, Parameters.of("basePrice", Money.pln(0), "stepSize", 1, "stepIncrement", 2));
        facade.addCalculator("percentage-rate", CalculatorType.PERCENTAGE, Parameters.of("percentageRate", 23));
    });

    it("should calculate monthly bill with base fees only", () => {
        facade.createSimpleComponent("network-maintenance-component", "network-maintenance");
        facade.createSimpleComponent("commission-component", "commission");
        facade.createCompositeComponent("base-fee", new Map(), "network-maintenance-component", "commission-component");

        const result = facade.calculateComponent("base-fee", Parameters.empty());
        expect(result.equals(Money.pln(45))).toBe(true);
    });

    it("should calculate bill with VAT depending on net amount", () => {
        facade.createSimpleComponent("network-maintenance-component", "network-maintenance");
        facade.createSimpleComponent("commission-component", "commission");
        facade.createSimpleComponent("data-overage-component", "data-overage");

        facade.createCompositeComponent("base-fee", new Map(), "network-maintenance-component", "commission-component");
        facade.createCompositeComponent("net-amount", new Map(), "base-fee", "data-overage-component");

        facade.createSimpleComponent("vat-component", "percentage-rate");
        facade.createCompositeComponent("total-bill",
            new Map([["vat-component", new Map([["baseAmount", new ValueOf("net-amount")]])]]),
            "net-amount", "vat-component"
        );

        const result = facade.calculateComponent("total-bill", Parameters.of("quantity", 3));
        // net=51, vat=11.73, total=62.73
        expect(result.equals(Money.pln(62.73))).toBe(true);
    });
});
