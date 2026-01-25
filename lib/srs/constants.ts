// Ease factor settings
export const SRS_DEFAULT_EASE = 2.5;
export const SRS_MIN_EASE = 1.3;
export const SRS_EASE_AGAIN = -0.2; // Ease penalty on lapse (Anki default)
export const SRS_EASE_HARD = -0.15;
export const SRS_EASE_EASY = 0.15;

// Review phase multipliers
export const SRS_HARD_FACTOR = 1.2;
export const SRS_EASY_BONUS = 1.3;
export const SRS_LAPSE_MULTIPLIER = 0; // Anki default: reset interval on lapse

// Learning phase intervals for new cards
export const SRS_NEW_FAILED_MS = 1 * 60 * 1000; // 1 minute
export const SRS_NEW_HARD_MS = 5 * 60 * 1000; // 5 minutes
export const SRS_NEW_GOOD_STEPS_MS = [10 * 60 * 1000]; // [10m] - then graduate
export const SRS_GRADUATING_INTERVAL_DAYS = 1; // Graduate to 1 day after Good steps

// Relearning phase (after lapse)
export const SRS_RELEARN_STEPS_MS = [10 * 60 * 1000];

// Easy intervals
export const SRS_EASY_INTERVAL_DAYS = 4;
