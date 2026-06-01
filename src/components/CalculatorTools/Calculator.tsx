"use client";

import { type ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calculator as CalculatorIcon, Delete, X } from "lucide-react";

type Operator = "+" | "-" | "×" | "÷" | "^";

interface CalculatorModalProps {
  onClose: () => void;
}

interface CalcButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: "default" | "muted" | "accent" | "scientific";
  className?: string;
}

const formatValue = (value: number) => {
  if (!Number.isFinite(value)) return "Error";
  const normalized = Number.parseFloat(value.toPrecision(12));
  return `${normalized}`;
};

const performCalculation = (
  left: number,
  right: number,
  operator: Operator,
) => {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "×":
      return left * right;
    case "÷":
      return right === 0 ? Number.NaN : left / right;
    case "^":
      return Math.pow(left, right);
    default:
      return right;
  }
};

const CalcButton = ({
  children,
  onClick,
  variant = "default",
  className = "",
}: CalcButtonProps) => {
  const variantClass =
    variant === "accent"
      ? "border border-(--color-text) bg-(--color-text) text-(--color-bg) hover:opacity-90"
      : variant === "scientific"
        ? "border border-(--color-active-border) bg-(--color-active-bg) text-(--color-active-text) hover:opacity-80 font-semibold"
        : variant === "muted"
          ? "border border-(--color-active-border) bg-(--color-active-bg) text-(--color-active-text) hover:opacity-90"
          : "border border-(--color-active-border) bg-(--color-bg) text-(--color-text) hover:bg-(--color-active-bg)";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className={`flex h-14 w-full touch-manipulation items-center justify-center rounded-2xl text-base font-medium transition-all duration-150 sm:h-16 sm:text-lg ${variantClass} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const CalculatorModal = ({ onClose }: CalculatorModalProps) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [openParens, setOpenParens] = useState(0);
  const [parenExpression, setParenExpression] = useState<string>("");
  const [isInParen, setIsInParen] = useState(false);
  const [parenNext, setParenNext] = useState<"open" | "close">("open");
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = (entry: string) => {
    setHistory((prev) => [entry, ...prev].slice(0, 20));
  };

  const resetCalculator = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNext(false);
    setOpenParens(0);
    setParenExpression("");
    setIsInParen(false);
    setParenNext("open");
  };

  const inputDigit = (digit: string) => {
    if (display === "Error") {
      setDisplay(digit);
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNext(false);
      return;
    }

    if (isInParen) {
      setParenExpression((prev) => (prev === "0" ? digit : `${prev}${digit}`));
      setDisplay((prev) => (prev === "0" ? digit : `${prev}${digit}`));
      return;
    }

    if (waitingForNext) {
      setDisplay(digit);
      setWaitingForNext(false);
      return;
    }

    setDisplay((prev) => (prev === "0" ? digit : `${prev}${digit}`));
  };

  const inputDecimal = () => {
    if (display === "Error") {
      setDisplay("0.");
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNext(false);
      return;
    }

    if (waitingForNext) {
      setDisplay("0.");
      setWaitingForNext(false);
      return;
    }

    if (!display.includes(".")) {
      setDisplay((prev) => `${prev}.`);
    }
  };

  const handleDelete = () => {
    if (display === "Error") {
      resetCalculator();
      return;
    }

    if (waitingForNext) return;

    setDisplay((prev) => {
      if (prev.length === 1) return "0";
      if (prev.length === 2 && prev.startsWith("-")) return "0";
      return prev.slice(0, -1);
    });
  };

  const toggleSign = () => {
    if (display === "0" || display === "Error") return;
    setDisplay((prev) => (prev.startsWith("-") ? prev.slice(1) : `-${prev}`));
  };

  const handlePercent = () => {
    if (display === "Error") return;
    const result = formatValue(Number(display) / 100);
    addToHistory(`${display}% = ${result}`);
    setDisplay(result);
  };

  const handleSquareRoot = () => {
    if (display === "Error") return;
    const val = Number(display);
    if (val < 0) {
      setDisplay("Error");
      return;
    }
    const result = formatValue(Math.sqrt(val));
    addToHistory(`√${display} = ${result}`);
    setDisplay(result);
    setWaitingForNext(true);
  };

  const handleLog = () => {
    if (display === "Error") return;
    const val = Number(display);
    if (val <= 0) {
      setDisplay("Error");
      return;
    }
    const result = formatValue(Math.log10(val));
    addToHistory(`log(${display}) = ${result}`);
    setDisplay(result);
    setWaitingForNext(true);
  };

  const handleParenToggle = () => {
    if (parenNext === "open") {
      setOpenParens((prev) => prev + 1);
      if (!isInParen) {
        setIsInParen(true);
        setParenExpression("0");
      }
      setParenNext("close");
    } else {
      if (openParens <= 0) return;
      setOpenParens((prev) => prev - 1);

      if (openParens === 1) {
        setIsInParen(false);
        try {
          const sanitized = parenExpression
            .replace(/×/g, "*")
            .replace(/÷/g, "/");
          const result = Function(`"use strict"; return (${sanitized})`)();
          const formatted = formatValue(Number(result));
          setDisplay(formatted);
          setParenExpression("");
        } catch {
          setDisplay("Error");
          setParenExpression("");
        }
      }
      setParenNext("open");
    }
  };

  const chooseOperator = (nextOperator: Operator) => {
    if (display === "Error") {
      resetCalculator();
      return;
    }

    if (isInParen) {
      setParenExpression((prev) => `${prev}${nextOperator}`);
      return;
    }

    const currentValue = Number(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operator && !waitingForNext) {
      const result = performCalculation(
        Number(previousValue),
        currentValue,
        operator,
      );
      const formatted = formatValue(result);

      setDisplay(formatted);
      setPreviousValue(formatted === "Error" ? null : formatted);
    }

    setOperator(nextOperator);
    setWaitingForNext(true);
  };

  const handleEquals = () => {
    if (
      !operator ||
      previousValue === null ||
      waitingForNext ||
      display === "Error"
    ) {
      return;
    }

    const result = performCalculation(
      Number(previousValue),
      Number(display),
      operator,
    );
    const formatted = formatValue(result);

    addToHistory(`${previousValue} ${operator} ${display} = ${formatted}`);

    setDisplay(formatted);
    setPreviousValue(formatted === "Error" ? null : formatted);
    setOperator(null);
    setWaitingForNext(true);
  };

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        inputDigit(event.key);
        return;
      }

      switch (event.key) {
        case ".":
          event.preventDefault();
          inputDecimal();
          break;
        case "+":
          event.preventDefault();
          chooseOperator("+");
          break;
        case "-":
          event.preventDefault();
          chooseOperator("-");
          break;
        case "*":
          event.preventDefault();
          chooseOperator("×");
          break;
        case "/":
          event.preventDefault();
          chooseOperator("÷");
          break;
        case "^":
          event.preventDefault();
          chooseOperator("^");
          break;
        case "%":
          event.preventDefault();
          handlePercent();
          break;
        case "(":
        case ")":
          event.preventDefault();
          handleParenToggle();
          break;
        case "Enter":
        case "=":
          event.preventDefault();
          handleEquals();
          break;
        case "Backspace":
          event.preventDefault();
          handleDelete();
          break;
        case "Delete":
        case "c":
        case "C":
          event.preventDefault();
          resetCalculator();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    display,
    previousValue,
    operator,
    waitingForNext,
    onClose,
    isInParen,
    parenExpression,
    openParens,
    parenNext,
  ]);

  return (
    <motion.div
      key="calculator-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50"
    >
      <div className="absolute inset-0 bg-(--color-active-bg) backdrop-blur-md" />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculator-modal-title"
        initial={{ opacity: 0, y: 30, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.985 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative flex h-dvh w-screen flex-col overflow-hidden bg-(--color-bg)"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-(--color-active-border) px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--color-active-bg)">
              <CalculatorIcon className="h-5 w-5 text-(--color-text)" />
            </div>
            <div>
              <h2
                id="calculator-modal-title"
                className="text-lg font-semibold text-(--color-text)"
              >
                Calculator
              </h2>
              <p className="text-sm text-(--color-gray)">
                Scientific calculator
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            aria-label="Close calculator"
            onClick={onClose}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white transition-colors duration-150 hover:bg-red-600"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-3 py-3 sm:px-6 sm:py-6">
          <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-start gap-4 sm:justify-center">
            {/* Calculator card */}
            <div className="flex w-full flex-col rounded-[28px] border border-(--color-active-border) bg-(--color-bg) p-3 sm:p-4">
              {/* Display */}
              <div className="rounded-[24px] border border-(--color-active-border) bg-(--color-active-bg) p-4 sm:p-5">
                <div className="flex min-h-5 items-center justify-between text-sm text-(--color-gray)">
                  <span>
                    {openParens > 0 ? `${"(".repeat(openParens)} open` : ""}
                  </span>
                  <span>
                    {previousValue && operator
                      ? `${previousValue} ${operator}`
                      : "Keyboard supported"}
                  </span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={display}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.14 }}
                    className="mt-3 text-right font-semibold tabular-nums text-(--color-text)"
                  >
                    <span className="block truncate text-[clamp(2.2rem,8vw,4rem)] leading-none">
                      {display}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Main keypad — 6 rows × 4 cols */}
              <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
                {/* Row 1: AC, DEL, %, ÷ */}
                <CalcButton variant="muted" onClick={resetCalculator}>
                  <span className="flex items-center gap-1.5">AC</span>
                </CalcButton>
                <CalcButton variant="muted" onClick={handleDelete}>
                  <Delete className="h-5 w-5" />
                </CalcButton>
                <CalcButton variant="muted" onClick={handlePercent}>
                  %
                </CalcButton>
                <CalcButton variant="muted" onClick={() => chooseOperator("÷")}>
                  ÷
                </CalcButton>

                {/* Row 2: 7, 8, 9, × */}
                <CalcButton onClick={() => inputDigit("7")}>7</CalcButton>
                <CalcButton onClick={() => inputDigit("8")}>8</CalcButton>
                <CalcButton onClick={() => inputDigit("9")}>9</CalcButton>
                <CalcButton variant="muted" onClick={() => chooseOperator("×")}>
                  ×
                </CalcButton>

                {/* Row 3: 4, 5, 6, − */}
                <CalcButton onClick={() => inputDigit("4")}>4</CalcButton>
                <CalcButton onClick={() => inputDigit("5")}>5</CalcButton>
                <CalcButton onClick={() => inputDigit("6")}>6</CalcButton>
                <CalcButton variant="muted" onClick={() => chooseOperator("-")}>
                  −
                </CalcButton>

                {/* Row 4: 1, 2, 3, + */}
                <CalcButton onClick={() => inputDigit("1")}>1</CalcButton>
                <CalcButton onClick={() => inputDigit("2")}>2</CalcButton>
                <CalcButton onClick={() => inputDigit("3")}>3</CalcButton>
                <CalcButton variant="muted" onClick={() => chooseOperator("+")}>
                  +
                </CalcButton>

                {/* Row 5: ±, 0, ., ( ) toggle */}
                <CalcButton onClick={toggleSign}>±</CalcButton>
                <CalcButton onClick={() => inputDigit("0")}>0</CalcButton>
                <CalcButton onClick={inputDecimal}>.</CalcButton>
                <CalcButton variant="scientific" onClick={handleParenToggle}>
                  <span className="flex items-center gap-0.5">
                    <span
                      className={
                        parenNext === "open" ? "opacity-100" : "opacity-40"
                      }
                    >
                      (
                    </span>
                    <span
                      className={
                        parenNext === "close" ? "opacity-100" : "opacity-40"
                      }
                    >
                      )
                    </span>
                  </span>
                </CalcButton>

                {/* Row 6: √, log, ^, = */}
                <CalcButton variant="scientific" onClick={handleSquareRoot}>
                  √
                </CalcButton>
                <CalcButton variant="scientific" onClick={handleLog}>
                  log
                </CalcButton>
                <CalcButton
                  variant="scientific"
                  onClick={() => chooseOperator("^")}
                >
                  x<sup>y</sup>
                </CalcButton>
                <CalcButton variant="accent" onClick={handleEquals}>
                  =
                </CalcButton>
              </div>

              <div className="mt-3 text-center text-xs text-(--color-gray)">
                Tap or use keyboard • Esc to close
              </div>
            </div>

            {/* History */}
            <AnimatePresence>
              {history.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full overflow-hidden rounded-[28px] border border-(--color-active-border) bg-(--color-bg) p-3 sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-(--color-text)">
                      History
                    </h3>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setHistory([])}
                      className="text-xs text-(--color-gray) transition-colors hover:text-(--color-text)"
                    >
                      Clear all
                    </motion.button>
                  </div>

                  <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto overscroll-contain">
                    <AnimatePresence initial={false}>
                      {history.map((entry, idx) => (
                        <motion.div
                          key={`${entry}-${idx}`}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.18 }}
                          className="rounded-xl border border-(--color-active-border) bg-(--color-active-bg) px-3 py-2.5 text-right text-sm tabular-nums text-(--color-text)"
                        >
                          {entry}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default CalculatorModal;
