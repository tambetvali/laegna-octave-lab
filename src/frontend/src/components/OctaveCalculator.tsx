import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  BASE4_DIGITS,
  type Base4Digit,
  ORDER_DESCRIPTIONS,
  ORDER_LABELS,
  type Order,
  decodeBase4,
  encodeBase4,
  formatNumber,
  scanReadout,
} from "@/lib/octave";
import { cn } from "@/lib/utils";
import { useOctaveStore } from "@/store/octave-store";
import { RotateCcw } from "lucide-react";

const ORDERS: Order[] = ["zeroeth", "first", "second"];

/** The octave ramp, used for the level spine. */
const OCTAVE_BG = [
  "bg-octave-0",
  "bg-octave-1",
  "bg-octave-2",
  "bg-octave-3",
  "bg-octave-4",
  "bg-octave-5",
];

/**
 * The shared octave calculator. Present on every page: it owns the
 * integral order/level, the base-4 I/O/A/E digit input, the k / L / zoom
 * scan readout, and the zeroeth / first / second order operations.
 */
export function OctaveCalculator({ className }: { className?: string }) {
  const params = useOctaveStore((s) => s.params);
  const setIntegralLevel = useOctaveStore((s) => s.setIntegralLevel);
  const setDigit = useOctaveStore((s) => s.setDigit);
  const setK = useOctaveStore((s) => s.setK);
  const setL = useOctaveStore((s) => s.setL);
  const setZoom = useOctaveStore((s) => s.setZoom);
  const setOrder = useOctaveStore((s) => s.setOrder);
  const reset = useOctaveStore((s) => s.reset);

  const scan = scanReadout(params);
  const digitValue = decodeBase4(params.digit);
  const levelIndex = Math.min(5, Math.max(0, params.integralLevel));

  return (
    <section
      className={cn("surface-output p-5", className)}
      aria-label="Octave calculator"
      data-ocid="octave.panel"
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">
            Octave calculator
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shared across every page — change it here, watch the lab follow.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          data-ocid="octave.reset_button"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </Button>
      </header>

      {/* Integral level spine */}
      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between">
          <Label
            htmlFor="octave-level"
            className="text-xs uppercase tracking-widest"
          >
            Integral level
          </Label>
          <span
            className="readout text-sm text-primary"
            data-ocid="octave.level_value"
          >
            {params.integralLevel}
          </span>
        </div>
        <Slider
          id="octave-level"
          value={[params.integralLevel]}
          min={0}
          max={5}
          step={1}
          onValueChange={([v]) => setIntegralLevel(v)}
          aria-label="Integral level"
          data-ocid="octave.level_slider"
        />
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {OCTAVE_BG.map((bg, i) => (
            <span
              key={bg}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-smooth",
                i <= levelIndex ? bg : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Base-4 digit input */}
      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Base-4 digit
          </span>
          <span className="readout text-xs text-muted-foreground">
            {params.digit} = {digitValue} · {encodeBase4(digitValue)}
          </span>
        </div>
        <fieldset
          className="grid grid-cols-4 gap-2"
          data-ocid="octave.digit_group"
        >
          <legend className="sr-only">Base-4 digit</legend>
          {BASE4_DIGITS.map((digit: Base4Digit, i) => {
            const active = params.digit === digit;
            return (
              <label
                key={digit}
                data-ocid={`octave.digit.${i + 1}`}
                className={cn(
                  "surface-input flex cursor-pointer flex-col items-center gap-0.5 py-2 transition-smooth",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="octave-digit"
                  value={digit}
                  checked={active}
                  onChange={() => setDigit(digit)}
                  className="sr-only"
                />
                <span className="font-mono text-base font-semibold">
                  {digit}
                </span>
                <span className="readout text-[10px] opacity-70">{i}</span>
              </label>
            );
          })}
        </fieldset>
      </div>

      {/* Order operations */}
      <div className="mb-5">
        <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
          Order operation
        </span>
        <fieldset
          className="grid grid-cols-3 gap-2"
          data-ocid="octave.order_group"
        >
          <legend className="sr-only">Order operation</legend>
          {ORDERS.map((order, i) => {
            const active = params.order === order;
            return (
              <label
                key={order}
                data-ocid={`octave.order.${i + 1}`}
                className={cn(
                  "surface-input cursor-pointer px-2 py-2 text-center text-xs font-medium capitalize transition-smooth",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="octave-order"
                  value={order}
                  checked={active}
                  onChange={() => setOrder(order)}
                  className="sr-only"
                />
                {order}
              </label>
            );
          })}
        </fieldset>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {ORDER_DESCRIPTIONS[params.order]}
        </p>
      </div>

      {/* k / L / zoom scan */}
      <div className="mb-5 space-y-4">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <Label
              htmlFor="octave-k"
              className="text-xs uppercase tracking-widest"
            >
              Scan index k
            </Label>
            <span
              className="readout text-sm text-primary"
              data-ocid="octave.k_value"
            >
              {params.k}
            </span>
          </div>
          <Slider
            id="octave-k"
            value={[params.k]}
            min={0}
            max={Math.max(1, Math.round(params.L))}
            step={1}
            onValueChange={([v]) => setK(v)}
            aria-label="Scan index k"
            data-ocid="octave.k_slider"
          />
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <Label
              htmlFor="octave-l"
              className="text-xs uppercase tracking-widest"
            >
              Scan length L
            </Label>
            <span
              className="readout text-sm text-primary"
              data-ocid="octave.l_value"
            >
              {params.L}
            </span>
          </div>
          <Slider
            id="octave-l"
            value={[params.L]}
            min={1}
            max={8}
            step={1}
            onValueChange={([v]) => setL(v)}
            aria-label="Scan length L"
            data-ocid="octave.l_slider"
          />
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <Label
              htmlFor="octave-zoom"
              className="text-xs uppercase tracking-widest"
            >
              Zoom
            </Label>
            <span
              className="readout text-sm text-primary"
              data-ocid="octave.zoom_value"
            >
              {params.zoom}×
            </span>
          </div>
          <Slider
            id="octave-zoom"
            value={[params.zoom]}
            min={1}
            max={4}
            step={1}
            onValueChange={([v]) => setZoom(v)}
            aria-label="Zoom"
            data-ocid="octave.zoom_slider"
          />
        </div>
      </div>

      {/* Readout */}
      <div className="surface-input p-3" data-ocid="octave.readout">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Scan readout
          </span>
          <Badge variant="secondary" className="readout text-[10px]">
            step {formatNumber(scan.step, 2)}
          </Badge>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted-foreground">k</dt>
            <dd className="readout text-foreground">{scan.current.k}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted-foreground">octave 2^k</dt>
            <dd className="readout text-foreground">
              {formatNumber(scan.current.octave)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted-foreground">rank value</dt>
            <dd className="readout text-foreground">
              {formatNumber(scan.current.value)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted-foreground">base-4</dt>
            <dd className="readout text-foreground">{scan.current.base4}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
          {scan.rows.map((row, i) => (
            <span
              key={`${row.k}-${i}`}
              className={cn(
                "readout rounded-sm px-1.5 py-0.5 text-[10px]",
                row.k === scan.current.k
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {row.base4}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {ORDER_LABELS[params.order]} · level {params.integralLevel} · digit{" "}
        <span className="readout">{params.digit}</span>
      </p>
    </section>
  );
}
