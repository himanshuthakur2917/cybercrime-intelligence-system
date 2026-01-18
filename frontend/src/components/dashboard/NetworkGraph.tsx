"use client";

import {
  networkLinks,
  NetworkNode,
  networkNodes,
  riskColors,
} from "@/data/mockData";
import { api } from "@/lib/api";
import * as d3 from "d3";
import { Loader2, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

interface NetworkGraphProps {
  onNodeClick: (nodeId: string) => void;
  investigationId?: string;
}

interface NetworkLink {
  source: string;
  target: string;
  calls: number;
}

// Extended types for D3 simulation
interface SimulationNode extends NetworkNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimulationLink {
  source: SimulationNode | string;
  target: SimulationNode | string;
  calls: number;
}

export default function NetworkGraph({
  onNodeClick,
  investigationId,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!investigationId) {
      setNodes(networkNodes);
      setLinks(networkLinks);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getNetworkData(investigationId);

        if (!response || !response.nodes) {
          throw new Error("Invalid data format received");
        }

        // Transform backend nodes to frontend NetworkNodes
        const transformedNodes: NetworkNode[] = response.nodes.map(
          (n: any) => ({
            id: n.id,
            name: n.label || "Unknown Suspect",
            role: n.networkRole || "Unknown",
            risk:
              n.riskScore >= 75
                ? "critical"
                : n.riskScore >= 40
                  ? "high"
                  : "low",
            radius: n.riskScore ? Math.max(12, Math.sqrt(n.riskScore) * 6) : 15,
            score: n.riskScore || 0,
          }),
        );

        // Transform backend edges to frontend NetworkLinks
        const transformedLinks: NetworkLink[] = response.edges.map(
          (e: any) => ({
            source: e.source,
            target: e.target,
            calls: e.call_count || e.count || 1,
          }),
        );

        setNodes(transformedNodes);
        setLinks(transformedLinks);
      } catch (err: any) {
        console.error("Error fetching network data:", err);
        setError(err.message || "Failed to load network visualization data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [investigationId]);

  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.3);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.7);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Add glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create main group for zooming
    const g = svg.append("g");

    // Simulation logic helper
    if (nodes.length === 0) return;

    // Copy data to avoid mutation
    const simulationNodes: SimulationNode[] = nodes.map((d) => ({ ...d }));
    const simulationLinks: SimulationLink[] = links.map((d) => ({ ...d }));

    // Simulation setup
    const simulation = d3
      .forceSimulation<SimulationNode>(simulationNodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(simulationLinks)
          .id((d) => d.id)
          .distance(150),
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide<SimulationNode>().radius((d) => d.radius + 15),
      );

    // Draw links
    const link = g
      .append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke", "#6E7681")
      .attr("stroke-width", (d) => Math.sqrt(d.calls) * 1.5);

    // Create node groups
    const node = g
      .append("g")
      .selectAll<SVGGElement, SimulationNode>("g")
      .data(simulationNodes)
      .join("g")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimulationNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => riskColors[d.risk])
      .attr("stroke", "#374151") // Darker stroke for definition
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.8)
      .style("filter", (d) => (d.risk === "critical" ? "url(#glow)" : null))
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d.id);
      })
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", d.radius * 1.2)
          .attr("stroke-width", 3);

        const tooltip = d3.select("#network-tooltip");
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `
          <div class="p-2 min-w-[150px]">
            <div class="font-bold border-b border-border pb-1 mb-1">${d.name}</div>
            <div class="text-xs text-muted-foreground capitalize">Role: ${d.role}</div>
            <div class="text-xs text-muted-foreground capitalize">Risk: ${d.risk}</div>
          </div>
        `,
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        d3.select("#network-tooltip")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", d.radius)
          .attr("stroke-width", 1.5);
        d3.select("#network-tooltip")
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add labels to nodes
    node
      .append("text")
      .text((d) => d.name)
      .attr("x", 0)
      .attr("y", (d) => d.radius + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#1f2937") // Dark gray for text
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 1px rgba(255,255,255,0.5)"); // White shadow for contrast if bg is not perfectly white

    // Update simulation on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Zoom behavior
    const zoom = d3
      .zoom<SVGGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    d3.select(svgRef.current).call(zoom);
    zoomRef.current = zoom;

    return () => {
      simulation.stop();
    };
  }, [nodes, links, onNodeClick]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            Investigation Network Graph
          </h2>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Graph Area */}
        <div
          ref={containerRef}
          className="flex-1 relative rounded-xl border bg-muted overflow-hidden"
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Analyzing Network Data...
                </span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="bg-destructive/10 border border-destructive text-destructive px-6 py-4 rounded-lg flex flex-col items-center gap-2">
                <span className="font-bold flex items-center gap-2">
                  <X className="w-5 h-5" /> Error
                </span>
                <span className="text-sm">{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-foreground"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full" />
        </div>

        {/* Fullscreen Controls */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomIn}
              className="h-9 px-3 bg-muted border border-border rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="h-9 px-3 bg-muted border border-border rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="h-9 px-3 bg-muted border border-border rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2"
            >
              <span className="text-xs font-medium">Reset View</span>
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D32F2F] glow-critical"></span>
              <span className="text-xs text-muted-foreground">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F57C00]"></span>
              <span className="text-xs text-muted-foreground">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#388E3C]"></span>
              <span className="text-xs text-muted-foreground">Low Risk</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal view
  return (
    <>
      <div className="h-full flex flex-col p-4 rounded-lg overflow-hidden shadow-sm ring-1 ring-accent-foreground/10 relative bg-muted">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h3 className="text-lg font-semibold text-card-foreground">
            Interactive Criminal Network
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleFullscreen}
              className="ml-2 h-8 px-3 bg-muted-foreground/20 shadow-sm shadow-black/30 ring-1 ring-accent-foreground/10 rounded text-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2"
              title="Expand to fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">
                Expand
              </span>
            </Button>
          </div>
        </div>

        {/* D3 Graph Container - Takes all available space */}
        <div
          ref={containerRef}
          className="graph-container flex-1 w-full relative overflow-hidden cursor-move rounded-lg shadow-sm ring-1 ring-accent-foreground/10 bg-background"
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-medium">Loading Network...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded flex flex-col items-center gap-1">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Error
                </span>
                <span className="text-xs text-center">{error}</span>
              </div>
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full" />
        </div>

        {/* Controls at bottom */}
        <div className="shrink-0 mt-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handleZoomIn}
              className="h-9 px-3 rounded text-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2 bg-muted-foreground/20 shadow-sm shadow-black/30 ring-1 ring-accent-foreground/10"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="h-9 px-3 rounded text-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2 bg-muted-foreground/20 shadow-sm shadow-black/30 ring-1 ring-accent-foreground/10"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="h-9 px-3 rounded text-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2 bg-muted-foreground/20 shadow-sm shadow-black/30 ring-1 ring-accent-foreground/10"
            >
              <span className="text-xs font-medium">Reset View</span>
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D32F2F] glow-critical"></span>
              <span className="text-xs text-muted-foreground">
                High Risk (Critical)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F57C00]"></span>
              <span className="text-xs text-muted-foreground">
                Medium Risk (Coordinator)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#388E3C]"></span>
              <span className="text-xs text-muted-foreground">
                Low Risk (Mule)
              </span>
            </div>
          </div>
        </div>
      </div>
      <div id="network-tooltip" className="d3-tooltip" />
    </>
  );
}
