# Mastery

Mastery is the learner model that will eventually guide scheduling, audio review, practice selection, and remediation.

## Foundation Rules

- Keep mastery calculations in `src/domain`, not React components.
- Mastery outputs should be explainable and auditable.
- Practice results should not reveal answer explanations before submission.
- Demo fixtures must be labeled `DEMO_NOT_FOR_PUBLICATION`.

## Future Inputs

- Submitted question attempts
- Confidence ratings
- Audio review completion
- Essay submissions
- Time since last review
- Reviewer-approved content metadata

## Future Outputs

- Readiness signals
- Review queue priority
- Study plan adjustments
- Analytics summaries

## Transparent Formula

Algorithm version: `DEMO_MASTERY_V1`.

For each taxonomy topic, compute component scores from reviewed learner events:

- Knowledge: Bayesian-smoothed accuracy using prior alpha `1.5` and beta `1.5`.
- Retention: recency decay from the most recent practice event with half-life `14` days.
- Coverage: distinct reviewed rules or question topics seen divided by the configured target coverage count.
- Speed: only contributes when accuracy is at least `0.60`; otherwise it is capped at `0.50`.
- Confidence calibration: agreement between confidence and correctness, penalizing high-confidence errors most.

Overall score is:

`0.40 * knowledge + 0.20 * retention + 0.15 * coverage + 0.10 * speed + 0.15 * confidenceCalibration`

Repeated questions count with reduced weight: first exposure `1.0`, second exposure `0.5`, later exposures `0.25`.

Before the minimum unique exposure count of `3`, the topic is provisional and data confidence is `LOW`. Scores remain visible but must explain that the evidence is still limited.

All mastery calculations must be deterministic for the same event history and algorithm version. Recalculation services should rebuild state from immutable mastery events rather than mutating historical events.
