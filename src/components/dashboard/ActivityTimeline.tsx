"use client";

import { getTimelineBorderClass, timelineEvents } from "@/data/mockData";

export default function ActivityTimeline() {
  return (
    <div className="glass-card p-6 flex-1 min-h-[200px]">
      <h4 className="text-base font-semibold text-white mb-4">
        Activity Timeline
      </h4>
      <div className="space-y-4">
        {timelineEvents.slice(0, 4).map((event) => (
          <div
            key={event.id}
            className={`timeline-item ${getTimelineBorderClass(
              event.riskLevel
            )}`}
          >
            <p className="text-xs text-[#6E7681] mb-1">
              {event.date.split("-").reverse().join("/")}, {event.time}
            </p>
            <p className="text-sm text-[#E1E4E8]">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}