import React, { useState, useEffect, memo } from 'react';
import { formatDuration } from '../lockScreen';

const WorkoutTimer = memo(({ timer, isEditing, initialDuration }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (timer?.status !== 'running' || isEditing) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer?.status, isEditing]);

  let totalSeconds = timer?.accumulatedSeconds || 0;
  if (timer?.status === 'running' && timer?.startTime) {
    totalSeconds += Math.floor((now - timer.startTime) / 1000);
  }

  if (isEditing && initialDuration) {
    totalSeconds = initialDuration;
  }

  return (
    <span className="font-mono font-bold">
      {formatDuration(totalSeconds)}
    </span>
  );
});

WorkoutTimer.displayName = 'WorkoutTimer';

export default WorkoutTimer;
