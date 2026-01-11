'use client';

import { useState } from 'react';

interface GraphData {
  success: boolean;
  data?: any[];
  error?: string;
}

export default function GraphDataFetcher() {
  const [s1Data, setS1Data] = useState<GraphData | null>(null);
  const [s2Data, setS2Data] = useState<GraphData | null>(null);
  const [s3Data, setS3Data] = useState<GraphData | null>(null);
  const [s4Data, setS4Data] = useState<GraphData | null>(null);
  const [seedingStatus, setSeedingStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Seed database with test data
  const seedDatabase = async () => {
    setLoading(true);
    setSeedingStatus('Seeding database...');
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });
      const data = await response.json();
      setSeedingStatus(`✅ ${data.message}`);
    } catch (error: any) {
      setSeedingStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch S1 - Investigation Network
  const fetchS1Data = async () => {
    try {
      const response = await fetch('/api/graphs/s1');
      const data = await response.json();
      setS1Data(data);
    } catch (error: any) {
      setS1Data({ success: false, error: error.message });
    }
  };

  // Fetch S2 - Suspect Network
  const fetchS2Data = async () => {
    try {
      const response = await fetch('/api/graphs/s2');
      const data = await response.json();
      setS2Data(data);
    } catch (error: any) {
      setS2Data({ success: false, error: error.message });
    }
  };

  // Fetch S3 - Evidence Trail
  const fetchS3Data = async () => {
    try {
      const response = await fetch('/api/graphs/s3');
      const data = await response.json();
      setS3Data(data);
    } catch (error: any) {
      setS3Data({ success: false, error: error.message });
    }
  };

  // Fetch S4 - Timeline Network
  const fetchS4Data = async () => {
    try {
      const response = await fetch('/api/graphs/s4');
      const data = await response.json();
      setS4Data(data);
    } catch (error: any) {
      setS4Data({ success: false, error: error.message });
    }
  };

  // Fetch all graphs
  const fetchAllGraphs = async () => {
    setLoading(true);
    await Promise.all([fetchS1Data(), fetchS2Data(), fetchS3Data(), fetchS4Data()]);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Neo4j Graph Data Manager</h1>

      {/* Control Panel */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Controls</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={seedDatabase}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Seeding...' : 'Seed Database'}
          </button>
          <button
            onClick={fetchAllGraphs}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Fetching...' : 'Fetch All Graphs'}
          </button>
        </div>
        {seedingStatus && (
          <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
            {seedingStatus}
          </div>
        )}
      </div>

      {/* Graph Display Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* S1 Graph */}
        <GraphCard
          title="S1: Investigation Network"
          description="Relationships between investigations"
          data={s1Data}
          onFetch={fetchS1Data}
        />

        {/* S2 Graph */}
        <GraphCard
          title="S2: Suspect-Case Network"
          description="Suspects linked to cases and vehicles"
          data={s2Data}
          onFetch={fetchS2Data}
        />

        {/* S3 Graph */}
        <GraphCard
          title="S3: Evidence Trail"
          description="Evidence connections across cases and suspects"
          data={s3Data}
          onFetch={fetchS3Data}
        />

        {/* S4 Graph */}
        <GraphCard
          title="S4: Timeline/Location Network"
          description="Geographic and temporal relationships"
          data={s4Data}
          onFetch={fetchS4Data}
        />
      </div>
    </div>
  );
}

interface GraphCardProps {
  title: string;
  description: string;
  data: GraphData | null;
  onFetch: () => void;
}

function GraphCard({ title, description, data, onFetch }: GraphCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <button
        onClick={onFetch}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mb-4"
      >
        Fetch Data
      </button>

      {data && (
        <div className="mt-4">
          {data.success ? (
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm font-semibold text-green-800 mb-2">
                ✅ Data Retrieved ({data.data?.length || 0} records)
              </p>
              <div className="bg-white p-3 rounded max-h-64 overflow-y-auto text-xs font-mono text-gray-700">
                <pre>{JSON.stringify(data.data, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded">
              <p className="text-sm font-semibold text-red-800">❌ Error</p>
              <p className="text-xs text-red-700 mt-1">{data.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
