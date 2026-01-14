"use client";

import React, { useState } from "react";
import {
  IconMapPin,
  IconClock,
  IconPhone,
  IconTarget,
} from "@tabler/icons-react";

// Mock suspects for dropdown
const mockSuspects = [
  { id: "S1", name: "Rajesh Kumar", phone: "+91 98765 43210" },
  { id: "S2", name: "Amit Singh", phone: "+91 98765 43211" },
  { id: "S3", name: "Priya Sharma", phone: "+91 98765 43212" },
  { id: "S4", name: "Vikram Patel", phone: "+91 76543 21098" },
];

// Mock trajectory data
const mockTrajectory = [
  {
    call_id: "CALL_001",
    timestamp: "2025-02-10 09:15:00",
    position: { latitude: 28.6139, longitude: 77.209, accuracy_m: 250 },
    tower_id: "DL001",
    tower_location: "Connaught Place, Delhi",
    receiver_phone: "+91 76543 21098",
    duration_seconds: 720,
  },
  {
    call_id: "CALL_002",
    timestamp: "2025-02-10 11:30:00",
    position: { latitude: 28.59, longitude: 77.18, accuracy_m: 300 },
    tower_id: "DL002",
    tower_location: "South Delhi",
    receiver_phone: "+91 76543 21098",
    duration_seconds: 450,
  },
  {
    call_id: "CALL_003",
    timestamp: "2025-02-10 14:45:00",
    position: { latitude: 28.57, longitude: 77.32, accuracy_m: 400 },
    tower_id: "DL003",
    tower_location: "Noida Sector 18",
    receiver_phone: "+91 98765 12345",
    duration_seconds: 300,
  },
  {
    call_id: "CALL_004",
    timestamp: "2025-02-11 10:00:00",
    position: { latitude: 28.65, longitude: 77.23, accuracy_m: 200 },
    tower_id: "DL004",
    tower_location: "North Delhi",
    receiver_phone: "+91 76543 21098",
    duration_seconds: 600,
  },
];

const mockPrediction = {
  suspect_id: "S1",
  suspect_name: "Rajesh Kumar",
  suspect_phone: "+91 98765 43210",
  last_known_position: {
    latitude: 28.65,
    longitude: 77.23,
    timestamp: "2025-02-11 10:00:00",
    accuracy_m: 200,
  },
  movement_pattern: ["Connaught Place", "South Delhi", "Noida", "North Delhi"],
  predicted_location: "North Delhi",
  confidence_level: "HIGH",
};

export default function TrackingPage() {
  const [selectedSuspect, setSelectedSuspect] = useState("S1");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎯 Suspect Tracking</h1>
          <p className="text-muted-foreground">
            Real-time movement tracking with triangulated positions
          </p>
        </div>
      </div>

      {/* Suspect Selector */}
      <div className="flex items-center gap-4">
        <label className="font-medium">Select Suspect:</label>
        <select
          value={selectedSuspect}
          onChange={(e) => setSelectedSuspect(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background"
        >
          {mockSuspects.map((suspect) => (
            <option key={suspect.id} value={suspect.id}>
              {suspect.name} ({suspect.phone})
            </option>
          ))}
        </select>
      </div>

      {/* Current/Predicted Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-card border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <IconMapPin className="h-5 w-5 text-blue-600" />
            Last Known Position
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Location:</strong>{" "}
              {mockPrediction.last_known_position.latitude.toFixed(4)}°N,{" "}
              {mockPrediction.last_known_position.longitude.toFixed(4)}°E
            </p>
            <p>
              <strong>Accuracy:</strong> ±
              {mockPrediction.last_known_position.accuracy_m}m
            </p>
            <p>
              <strong>Timestamp:</strong>{" "}
              {mockPrediction.last_known_position.timestamp}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <IconTarget className="h-5 w-5 text-green-600" />
            Predicted Location
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Area:</strong> {mockPrediction.predicted_location}
            </p>
            <p>
              <strong>Confidence:</strong>{" "}
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  mockPrediction.confidence_level === "HIGH"
                    ? "bg-green-600 text-white"
                    : mockPrediction.confidence_level === "MEDIUM"
                    ? "bg-yellow-500 text-black"
                    : "bg-red-500 text-white"
                }`}
              >
                {mockPrediction.confidence_level}
              </span>
            </p>
            <p>
              <strong>Pattern:</strong>{" "}
              {mockPrediction.movement_pattern.join(" → ")}
            </p>
          </div>
        </div>
      </div>

      {/* Movement Trajectory */}
      <div>
        <h2 className="text-xl font-semibold mb-4">📍 Movement Trajectory</h2>
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-4">
            {mockTrajectory.map((point, idx) => (
              <div key={point.call_id} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2.5 w-4 h-4 rounded-full border-2 border-background ${
                    idx === 0 ? "bg-green-500" : "bg-blue-500"
                  }`}
                ></div>

                {/* Card */}
                <div className="p-4 rounded-lg bg-card border hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Position {idx + 1}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <IconClock className="h-4 w-4" />
                      {point.timestamp}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tower</p>
                      <p className="font-medium">{point.tower_location}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {point.tower_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Coordinates</p>
                      <p className="font-medium">
                        {point.position.latitude.toFixed(4)}°N,{" "}
                        {point.position.longitude.toFixed(4)}°E
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ±{point.position.accuracy_m}m accuracy
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Called</p>
                      <p className="font-medium flex items-center gap-1">
                        <IconPhone className="h-4 w-4" />
                        {point.receiver_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {Math.floor(point.duration_seconds / 60)}m{" "}
                        {point.duration_seconds % 60}s
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          📥 Export Trajectory (JSON)
        </button>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
          🗺️ Export KML (Google Earth)
        </button>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
          🖨️ Print Report
        </button>
      </div>
    </div>
  );
}
