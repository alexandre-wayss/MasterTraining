import { formatNumber } from "../utils/format";

type ProgressBarProps = {
  value: number;
  target?: number;
};

export function ProgressBar({ value, target }: ProgressBarProps) {
  const percent = target && target > 0 ? Math.min((value / target) * 100, 140) : 0;

  return (
    <div className="progress-wrap">
      <div className="progress-track" aria-hidden="true">
        <div
          className={percent > 110 ? "progress-fill progress-over" : "progress-fill"}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
        {percent > 100 ? <div className="progress-overflow" style={{ width: `${Math.min(percent - 100, 40)}%` }} /> : null}
      </div>
      <span className="progress-label">
        {formatNumber(value)} / {target ? formatNumber(target) : "sem meta"}
      </span>
    </div>
  );
}
