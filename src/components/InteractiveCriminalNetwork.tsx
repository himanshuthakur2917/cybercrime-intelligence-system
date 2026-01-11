'use client';

import { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  label: string;
  title: string;
  color: string;
  value: number;
  role: string;
  risk: string;
  properties: any;
}

interface Edge {
  from: string;
  to: string;
  label: string;
  color: { color: string };
  arrows: string;
  relationship: any;
}

interface NetworkData {
  nodes: Node[];
  edges: Edge[];
  rawData: any[];
}

export default function InteractiveCriminalNetwork() {
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/graphs/network');
      const data = await response.json();
      if (data.success) {
        setNetworkData(data.data);
      }
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Draw network graph on canvas
  useEffect(() => {
    if (!networkData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#0A0E27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate layout using simple force-directed algorithm
    const positions: Map<string, { x: number; y: number }> = new Map();
    
    // Initialize positions randomly
    networkData.nodes.forEach(node => {
      positions.set(node.id, {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
      });
    });

    // Draw edges first (behind nodes)
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 2;

    networkData.edges.forEach(edge => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (from && to) {
        ctx.strokeStyle = edge.color.color;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowSize = 15;
        ctx.save();
        ctx.translate(to.x, to.y);
        ctx.rotate(angle);
        ctx.fillStyle = edge.color.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize, -arrowSize / 2);
        ctx.lineTo(-arrowSize, arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });

    // Draw nodes
    networkData.nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const radius = node.value || 20;
      
      // Draw node circle
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = selectedNode?.id === node.id ? '#FFD700' : '#FFFFFF';
      ctx.lineWidth = selectedNode?.id === node.id ? 3 : 2;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, pos.x, pos.y);
    });

  }, [networkData, selectedNode]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#0A0E27]">
        <div className="text-white text-xl">Loading criminal network...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#0A0E27] text-white p-4">
      <div className="grid grid-cols-4 gap-4 h-full">
        {/* Main Graph */}
        <div className="col-span-3">
          <div className="glass-card p-4 h-full">
            <h2 className="text-2xl font-bold mb-4">Criminal Network Visualization</h2>
            <canvas 
              ref={canvasRef}
              className="w-full h-96 bg-[#0A0E27] rounded border border-[#1E88E5]"
            />
          </div>
        </div>

        {/* Info Panel */}
        <div className="glass-card p-4 overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">Network Overview</h3>
          
          {networkData && (
            <div className="space-y-4">
              <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded">
                <p className="text-[#8B949E] text-sm">Total Suspects</p>
                <p className="text-2xl font-bold">{networkData.nodes.length}</p>
              </div>
              
              <div className="bg-[rgba(255,255,255,0.05)] p-3 rounded">
                <p className="text-[#8B949E] text-sm">Connections</p>
                <p className="text-2xl font-bold">{networkData.edges.length}</p>
              </div>

              <div className="border-t border-[#30363D] mt-4 pt-4">
                <h4 className="font-semibold mb-3">Suspects</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {networkData.nodes.map(node => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-2 rounded cursor-pointer transition-all ${
                        selectedNode?.id === node.id
                          ? 'bg-[#1E88E5] border border-[#00BCD4]'
                          : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: node.color }}
                        />
                        <div>
                          <p className="font-semibold text-sm">{node.id}</p>
                          <p className="text-xs text-[#8B949E]">{node.role}</p>
                        </div>
                      </div>
                      <p className={`text-xs mt-1 ${
                        node.risk === 'Critical' ? 'text-red-400' :
                        node.risk === 'High' ? 'text-orange-400' :
                        'text-green-400'
                      }`}>Risk: {node.risk}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedNode && (
                <div className="border-t border-[#30363D] mt-4 pt-4">
                  <h4 className="font-semibold mb-3">Selected: {selectedNode.id}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-[#8B949E]">Role:</p>
                      <p className="text-white">{selectedNode.role}</p>
                    </div>
                    <div>
                      <p className="text-[#8B949E]">Risk Level:</p>
                      <p className={`font-semibold ${
                        selectedNode.risk === 'Critical' ? 'text-red-400' :
                        selectedNode.risk === 'High' ? 'text-orange-400' :
                        'text-green-400'
                      }`}>{selectedNode.risk}</p>
                    </div>
                    {selectedNode.properties && (
                      <div>
                        <p className="text-[#8B949E]">Properties:</p>
                        <pre className="text-xs bg-[#0A0E27] p-2 rounded overflow-x-auto">
                          {JSON.stringify(selectedNode.properties, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={fetchNetworkData}
                className="w-full mt-4 px-4 py-2 bg-[#1E88E5] hover:bg-[#00BCD4] rounded font-semibold transition-colors"
              >
                Refresh Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="fixed bottom-4 left-4 glass-card p-4">
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span>Red: Kingpin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span>Orange: Coordinator</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Green: Mule</span>
          </div>
        </div>
      </div>
    </div>
  );
}
