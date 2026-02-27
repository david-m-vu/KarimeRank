import { memo, useEffect, useMemo, useRef } from "react";
import { animated, useSpring } from "react-spring";
import "./RollingNumber.css";

const DIGIT_REEL = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];

// format number with commas as a string 
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

const RollingNumber = ({ value, className = "" }) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  
  const previousValueRef = useRef(safeValue);
  const direction = safeValue >= previousValueRef.current ? 1 : -1; // direction 1 means value is increasing

  useEffect(() => {
    previousValueRef.current = safeValue;
  }, [safeValue]);

  // useMemo not too necessary, just an optimization guard to avoid recomputing on unrelated re-renders
  // signal "this value is derived from safeValue only, but practical performance difference is small"
  const formattedValue = useMemo(() => NUMBER_FORMATTER.format(safeValue), 
    [safeValue]
  );
  const mergedClassName = ["rolling-number", className].filter(Boolean).join(" ");
  const characters = Array.from(formattedValue); // create a new array with each character as its own element

  // count how many digits are in the characters array
  const digitCount = characters.reduce((count, character) => {
    return count + (/\d/.test(character) ? 1 : 0);
  }, 0);

  let seenDigits = 0;

  return (
    <span 
      className={mergedClassName} 
      aria-label={formattedValue} 
      aria-live="polite" 
      aria-atomic="true"
    >
      {characters.map((character, index) => {
        if (!/\d/.test(character)) {
          return (
            <span key={`separator-${character}-${index}`} className="rolling-number__separator" aria-hidden="true">
              {character}
            </span>
          );
        }

        // 0 indexed
        const placeFromRight = digitCount - seenDigits - 1;
        seenDigits += 1;

        return (
          <DigitColumn key={`digit-${placeFromRight}`} digit={Number(character)} direction={direction} />
        );
      })}
    </span>
  );
};

const DigitColumn = memo(function DigitColumn({ digit, direction }) {
  const previousDigitRef = useRef(digit);

  // index represents which row in the digit reel should be visible (custom animated value)
  const [{ index }, api] = useSpring(() => ({
    index: 10 + digit, // set inital position to middle copy of the digit in DIGIT_REEL
    immediate: true, // on first render, jump directly to initial position
    config: { tension: 220, friction: 28, mass: 0.9 },
  }));

  useEffect(() => {
    const previousDigit = previousDigitRef.current;
    if (previousDigit === digit) {
      return;
    }

    // since total can jump more than one
    const forwardStep = (digit - previousDigit + 10) % 10;
    const backwardStep = (previousDigit - digit + 10) % 10;
    const step = direction >= 0 ? forwardStep : -backwardStep;

    // animate index from one number to another
    api.start({
      from: { index: 10 + previousDigit },
      to: { index: 10 + previousDigit + step },
      immediate: false, // so that it animates
    });

    previousDigitRef.current = digit;
  }, [api, digit, direction]);

  return (
    <span className="rolling-number__digit-window" aria-hidden="true">
      <animated.span
        className="rolling-number__digit-strip"
        style={{
          // index.to converts the numeric spring value into a CSS string
          transform: index.to((value) => `translate3d(0, ${-value}em, 0)`), // negative value makes higher index move the strip upward, when index updates
        }}
      >
        {DIGIT_REEL.map((reelDigit, reelIndex) => (
          <span key={`${reelDigit}-${reelIndex}`} className="rolling-number__digit">
            {reelDigit}
          </span>
        ))}
      </animated.span>
    </span>
  );
});

export default RollingNumber;
