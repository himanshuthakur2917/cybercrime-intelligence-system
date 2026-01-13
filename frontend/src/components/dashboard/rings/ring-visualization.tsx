"use client";

import { Badge } from "@/components/ui/badge";
import { getSuspectById, riskColors } from "@/data/mockData";

interface RingVisualizationProps {
  ringId: number;
  members: string[];
}

export function RingVisualization({ ringId, members }: RingVisualizationProps) {
  // Simple SVG Visualization for Ring #1 (The main example)
  if (ringId === 1) {
    return (
      <div className="relative w-full max-w-2xl aspect-video mx-auto">
        <svg className="w-full h-full" viewBox="0 0 600 300">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="8"
              refX="33"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 12 4, 0 8" fill="#64748b" />
            </marker>
            <filter id="solid-bg" x="-0.1" y="-0.1" width="1.2" height="1.2">
              <feFlood floodColor="var(--background)" result="bg" />
              <feMerge>
                <feMergeNode in="bg" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection Lines (with better spacing and color) */}

          {/* S1 (Left) <-> S4 (Center) */}
          <line
            x1="150"
            y1="150"
            x2="300"
            y2="80"
            stroke="#94a3b8"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            opacity="0.6"
          />
          <line
            x1="300"
            y1="80"
            x2="150"
            y2="150"
            stroke="#94a3b8"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            opacity="0.6"
          />

          {/* Label for S1-S4 */}
          <rect
            x="190"
            y="100"
            width="60"
            height="20"
            rx="4"
            fill="var(--background)"
            fillOpacity="0.9"
          />
          <text
            x="220"
            y="114"
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#64748b"
          >
            12 calls
          </text>

          {/* S4 (Center) <-> S2 (Right) */}
          <line
            x1="300"
            y1="80"
            x2="450"
            y2="150"
            stroke="#94a3b8"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            opacity="0.6"
          />
          <line
            x1="450"
            y1="150"
            x2="300"
            y2="80"
            stroke="#94a3b8"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            opacity="0.6"
          />

          {/* Label for S4-S2 */}
          <rect
            x="350"
            y="100"
            width="60"
            height="20"
            rx="4"
            fill="var(--background)"
            fillOpacity="0.9"
          />
          <text
            x="380"
            y="114"
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#64748b"
          >
            6 calls
          </text>

          {/* S4 (Center) <-> S3 (Bottom) */}
          <line
            x1="300"
            y1="80"
            x2="300"
            y2="220"
            stroke="#475569"
            strokeWidth="4"
            markerEnd="url(#arrowhead)"
          />

          {/* Label for S4-S3 */}
          <rect
            x="270"
            y="140"
            width="60"
            height="40"
            rx="4"
            fill="var(--background)"
            fillOpacity="0.9"
          />
          <text
            x="300"
            y="160"
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#64748b"
          >
            20 calls
          </text>
          <text
            x="300"
            y="175"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#f59e0b"
          >
            (High)
          </text>

          {/* Nodes */}

          {/* S1 - Left */}
          <g transform="translate(150, 150)">
            <circle
              r="30"
              fill="var(--background)"
              stroke={riskColors.high}
              strokeWidth="3"
            />
            <circle
              r="30"
              fill={riskColors.high}
              fillOpacity="0.1"
              className="cursor-pointer hover:fill-opacity-20 transition-all"
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="currentColor"
              fontWeight="bold"
              fontSize="14"
            >
              S1
            </text>
            <text
              x="0"
              y="48"
              textAnchor="middle"
              fill="currentColor"
              fontSize="12"
              className="opacity-70"
            >
              Coordinator
            </text>
          </g>

          {/* S4 - Kingpin (Top Center) */}
          <g transform="translate(300, 80)">
            {/* Pulsing effect */}
            <circle
              r="40"
              fill={riskColors.critical}
              fillOpacity="0.1"
              className="animate-pulse"
            />
            <circle
              r="40"
              fill="var(--background)"
              stroke={riskColors.critical}
              strokeWidth="4"
            />
            <circle
              r="40"
              fill={riskColors.critical}
              fillOpacity="0.15"
              className="cursor-pointer hover:fill-opacity-25 transition-all"
            />
            <text
              x="0"
              y="8"
              textAnchor="middle"
              fill="currentColor"
              fontWeight="bold"
              fontSize="18"
            >
              S4
            </text>
            <text
              x="0"
              y="-55"
              textAnchor="middle"
              fill={riskColors.critical}
              fontWeight="800"
              fontSize="14"
              className="uppercase tracking-wider"
            >
              KINGPIN
            </text>
          </g>

          {/* S2 - Right */}
          <g transform="translate(450, 150)">
            <circle
              r="30"
              fill="var(--background)"
              stroke={riskColors.high}
              strokeWidth="3"
            />
            <circle
              r="30"
              fill={riskColors.high}
              fillOpacity="0.1"
              className="cursor-pointer hover:fill-opacity-20 transition-all"
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="currentColor"
              fontWeight="bold"
              fontSize="14"
            >
              S2
            </text>
            <text
              x="0"
              y="48"
              textAnchor="middle"
              fill="currentColor"
              fontSize="12"
              className="opacity-70"
            >
              Coordinator
            </text>
          </g>

          {/* S3 - Bottom */}
          <g transform="translate(300, 220)">
            <circle
              r="30"
              fill="var(--background)"
              stroke={riskColors.high}
              strokeWidth="3"
            />
            <circle
              r="30"
              fill={riskColors.high}
              fillOpacity="0.1"
              className="cursor-pointer hover:fill-opacity-20 transition-all"
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="currentColor"
              fontWeight="bold"
              fontSize="14"
            >
              S3
            </text>
            <text
              x="0"
              y="48"
              textAnchor="middle"
              fill="currentColor"
              fontSize="12"
              className="opacity-70"
            >
              Coordinator
            </text>
          </g>
        </svg>
        <p className="text-center text-sm font-medium text-muted-foreground mt-4">
          Visual Map: Thicker lines = Higher frequency // Kingpin at center
        </p>
      </div>
    );
  }

  // Simplified Horizontal Layout for Smaller/Other Rings
  return (
    <div className="flex items-center gap-8 justify-center w-full py-8">
      {members.map((memberId, idx) => {
        const member = getSuspectById(memberId);
        if (!member) return null;
        return (
          <div key={memberId} className="flex items-center">
            {idx > 0 && (
              <div className="h-[2px] w-16 bg-muted-foreground/30 mx-2 relative">
                <span className="absolute -top-4 w-full text-center text-[10px] text-muted-foreground">
                  Connected
                </span>
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-foreground font-bold text-lg border-2 bg-background shadow-sm hover:scale-110 transition-transform cursor-pointer"
                style={{
                  borderColor: riskColors[member.riskLevel],
                  backgroundColor: `${riskColors[member.riskLevel]}10`,
                }}
                title={`${member.name} - ${member.role}`}
              >
                {member.id}
              </div>
              <div className="text-center">
                <p className="text-xs font-medium">
                  {member.name.split(" ")[0]}
                </p>
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1 mt-1 border-0 bg-muted"
                >
                  {member.role}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
