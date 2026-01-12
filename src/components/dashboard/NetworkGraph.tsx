"use client";

import {
    networkLinks,
    NetworkNode,
    networkNodes,
    riskColors,
} from "@/data/mockData";
import * as d3 from "d3";
import { ChevronDown, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface NetworkGraphProps {
  onNodeClick: (nodeId: string) => void;
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

export default function NetworkGraph({ onNodeClick }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

    // Copy data to avoid mutation
    const nodes: SimulationNode[] = networkNodes.map((d) => ({ ...d }));
    const links: SimulationLink[] = networkLinks.map((d) => ({ ...d }));

    // Simulation setup
    const simulation = d3
      .forceSimulation<SimulationNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide<SimulationNode>().radius((d) => d.radius + 15)
      );

    // Draw links
    const link = g
      .append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#6E7681")
      .attr("stroke-width", (d) => Math.sqrt(d.calls) * 1.5);

    // Create node groups
    const node = g
      .append("g")
      .selectAll<SVGGElement, SimulationNode>("g")
      .data(nodes)
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
          })
      );

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => riskColors[d.risk])
      .attr("stroke", "#fff")
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
          .attr("r", d.radius + 5);

        // Show tooltip
        const tooltip = d3.select("#network-tooltip");
        tooltip
          .style("opacity", "1")
          .html(
            `<strong>${d.name} (${d.id})</strong><br/>${d.role}<br/>Risk: ${d.score}/100`
          )
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).transition().duration(200).attr("r", d.radius);
        d3.select("#network-tooltip").style("opacity", "0");
      });

    // Add labels to nodes
    node
      .append("text")
      .text((d) => d.id)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("font-family", "Inter, sans-serif")
      .attr("pointer-events", "none");

    // Tick function
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimulationNode).x!)
        .attr("y1", (d) => (d.source as SimulationNode).y!)
        .attr("x2", (d) => (d.target as SimulationNode).x!)
        .attr("y2", (d) => (d.target as SimulationNode).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    return () => {
      simulation.stop();
    };
  }, [onNodeClick, isFullscreen]);

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0D1117] flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.1)]">
          <h3 className="text-lg font-semibold text-white">
            Interactive Criminal Network
          </h3>
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-lg bg-[#D32F2F] hover:bg-[#B71C1C] flex items-center justify-center text-white transition-colors"
            title="Exit fullscreen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fullscreen Graph */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden cursor-move"
        >
          <svg ref={svgRef} className="w-full h-full" />
          <div id="network-tooltip" className="d3-tooltip" />
        </div>

        {/* Fullscreen Controls */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomIn}
              className="h-9 px-3 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="h-9 px-3 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="h-9 px-3 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <span className="text-xs font-medium">Reset View</span>
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D32F2F] glow-critical"></span>
              <span className="text-xs text-[#8B949E]">Kingpin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F57C00]"></span>
              <span className="text-xs text-[#8B949E]">Coordinator</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#388E3C]"></span>
              <span className="text-xs text-[#8B949E]">Mule</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal view
  return (
    <div className="h-full flex flex-col glass-card p-4 overflow-hidden relative">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <h3 className="text-lg font-semibold text-white">
          Interactive Criminal Network
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded badge-outline-critical text-xs font-medium">
            Critical Risk
          </span>
          <span className="px-2 py-1 rounded badge-outline-high text-xs font-medium">
            High Activity
          </span>
          <button
            onClick={toggleFullscreen}
            className="ml-2 h-8 px-3 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            title="Expand to fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Expand</span>
          </button>
        </div>
      </div>

      {/* D3 Graph Container - Takes all available space */}
      <div
        ref={containerRef}
        className="graph-container flex-1 w-full relative overflow-hidden cursor-move rounded-lg"
      >
        <svg ref={svgRef} className="w-full h-full" />
        <div id="network-tooltip" className="d3-tooltip" />
      </div>

      {/* Controls at bottom */}
      <div className="shrink-0 mt-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleZoomIn}
            className="h-9 px-3 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="h-9 px-3 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="h-9 px-3 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <span className="text-xs font-medium">Reset View</span>
          </button>
          <div className="h-6 w-px bg-[rgba(255,255,255,0.1)] mx-1"></div>
          <button className="h-9 px-3 bg-[#161B22] border border-[rgba(255,255,255,0.1)] rounded text-[#8B949E] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
            <span className="text-xs font-medium">Filter: All Risks</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D32F2F] glow-critical"></span>
            <span className="text-xs text-[#8B949E]">Kingpin (Critical)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F57C00]"></span>
            <span className="text-xs text-[#8B949E]">Coordinator (High)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#388E3C]"></span>
            <span className="text-xs text-[#8B949E]">Mule (Low)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[#6E7681] rounded-full"></div>
            <span className="text-xs text-[#8B949E]">Freq. Calls (&gt;15)</span>
          </div>
        </div>
      </div>
    </div>
  );
}