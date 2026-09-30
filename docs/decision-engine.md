# Deterministic Business Decision Engine Specification

## Principles

1. **AI OBSERVES. APPLICATION DECIDES.**
2. **Reproducibility**: Identical inputs always produce identical decisions.
3. **Evidence-backed**: Every non-PASS or UNCERTAIN result is accompanied by exact visual observations and image references.

## Decision Matrix

### Parameter Rules

| Parameter | Condition | Status |
| :--- | :--- | :--- |
| **SKU** | Observed SKU matches Expected PO SKU | `PASS` |
| | Observed SKU differs from Expected PO SKU | `FAIL` |
| | Observed SKU is `null` or confidence < 0.5 | `UNCERTAIN` |
| **QUANTITY** | Observed count === Expected PO Quantity | `PASS` |
| | Observed count !== Expected PO Quantity | `FAIL` |
| | Observed count is `null` or confidence < 0.5 | `UNCERTAIN` |
| **VARIANT** | Observed variant matches Expected PO Variant | `PASS` |
| | Observed variant differs from Expected PO Variant | `FAIL` |
| | Observed variant is `null` or confidence < 0.5 | `UNCERTAIN` |
| **DAMAGE** | `damaged === false` and no damage types detected | `PASS` |
| | `damaged === true` or damage types present | `FAIL` |
| | `damaged === null` or confidence < 0.5 | `UNCERTAIN` |
| **COMPONENTS** | No missing required components | `PASS` |
| | One or more required components missing | `FAIL` |
| | Confidence < 0.5 | `UNCERTAIN` |

### Overall Decision Roll-up Rules

```ts
if (anyCheckStatus === "FAIL") {
  overallDecision = "EXCEPTION";
} else if (anyCheckStatus === "UNCERTAIN") {
  overallDecision = "UNCERTAIN";
} else {
  overallDecision = "PASS";
}
```
