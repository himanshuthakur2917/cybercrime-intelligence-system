"""
Cybercrime Intelligence System - FastAPI Application
=====================================================
AI-powered criminal network analysis and intelligence system.
"""
import logging
import time

from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import APP_TITLE, APP_VERSION, APP_DESCRIPTION, MAX_KINGPINS, DATA_CHUNK_SIZE
from data_loader import load_or_generate_data, load_or_generate_data_in_chunks
from graph_builder import build_graph, GraphBuilder
from kingpin import get_kingpin_scores, KingpinAnalyzer
from fraud_rings import detect_rings, FraudRingDetector
from risk_model import train_and_score, RiskScorer
from intelligence import generate_brief, IntelligenceGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global state
STARTUP_TIME: Optional[float] = None
GRAPH_CACHE: Dict[str, Any] = {}


# Pydantic Models
class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float


class SuspectAnalysis(BaseModel):
    suspect: str
    name: str
    risk: float
    ring: str
    connections: List[str]
    ai_brief: str


class AnalysisResponse(BaseModel):
    kingpins: List[Dict[str, Any]]
    rings: Dict[str, List[str]]
    analysis: List[SuspectAnalysis]
    summary: Dict[str, Any]


class KingpinResponse(BaseModel):
    kingpins: List[Dict[str, Any]]
    total_nodes: int


class RingsResponse(BaseModel):
    rings: Dict[str, List[str]]
    ring_statistics: List[Dict[str, Any]]


class RiskResponse(BaseModel):
    risk_scores: Dict[str, float]
    summary: Dict[str, Any]
    high_risk_nodes: List[Dict[str, Any]]


class BriefRequest(BaseModel):
    suspect_id: str = Field(..., description="Suspect ID")
    name: str = Field(..., description="Suspect name")
    risk_score: float = Field(0.5, ge=0, le=1, description="Risk score")
    ring: str = Field("Unknown", description="Ring affiliation")
    connections: List[str] = Field(default_factory=list, description="List of connections")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    global STARTUP_TIME
    STARTUP_TIME = time.time()
    logger.info("CIS AI Engine starting up...")
    
    # Pre-load data and build graph
    try:
        suspects, calls, transactions = load_or_generate_data()
        graph = build_graph(calls, transactions)
        GRAPH_CACHE['graph'] = graph
        GRAPH_CACHE['suspects'] = suspects
        GRAPH_CACHE['calls'] = calls
        GRAPH_CACHE['transactions'] = transactions
        logger.info(f"Loaded graph with {graph.number_of_nodes()} nodes and {graph.number_of_edges()} edges")
    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
    
    yield
    
    logger.info("CIS AI Engine shutting down...")



# Create FastAPI app
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "detail": "Internal server error"}
    )


@app.get("/", response_model=HealthResponse)
def home():
    """Health check endpoint."""
    uptime = time.time() - STARTUP_TIME if STARTUP_TIME else 0
    return HealthResponse(
        status="CIS AI Engine Running",
        version=APP_VERSION,
        uptime_seconds=round(uptime, 2)
    )


@app.get("/health")
def health_check():
    """Detailed health check."""
    graph = GRAPH_CACHE.get('graph')
    return {
        "status": "healthy",
        "version": APP_VERSION,
        "graph_loaded": graph is not None,
        "nodes": graph.number_of_nodes() if graph else 0,
        "edges": graph.number_of_edges() if graph else 0,
        "uptime_seconds": round(time.time() - STARTUP_TIME, 2) if STARTUP_TIME else 0
    }


@app.get("/analyze", response_model=AnalysisResponse)
def analyze(
    include_brief: bool = Query(True, description="Include AI-generated briefs"),
    max_kingpins: int = Query(MAX_KINGPINS, ge=1, le=50, description="Number of top kingpins to return")
):
    """
    Perform full network analysis.
    
    Returns kingpins, fraud rings, risk scores, and intelligence briefs for all suspects.
    """
    start_time = time.time()
    
    # Get cached data or reload
    if 'graph' not in GRAPH_CACHE:
        suspects, calls, transactions = load_or_generate_data()
        graph = build_graph(calls, transactions)
        GRAPH_CACHE['graph'] = graph
        GRAPH_CACHE['suspects'] = suspects
    else:
        graph = GRAPH_CACHE['graph']
        suspects = GRAPH_CACHE['suspects']
    
    # Perform analysis
    kingpin_analyzer = KingpinAnalyzer(graph)
    kingpins = kingpin_analyzer.get_top_kingpins(n=max_kingpins, include_metrics=True)
    
    ring_detector = FraudRingDetector(graph)
    rings = ring_detector.detect_community()
    
    risk_scorer = RiskScorer(graph)
    risk_scorer.train()
    risk_scores = risk_scorer.score_nodes()
    
    # Build analysis results
    results = []
    intel_generator = IntelligenceGenerator() if include_brief else None
    
    for _, row in suspects.iterrows():
        sid = str(row["suspect_id"])
        name = row["name"]
        
        # Find ring membership
        ring = "None"
        for k, v in rings.items():
            if sid in v:
                ring = f"Ring-{k}"
                break
        
        # Get connections
        connections = list(graph.neighbors(sid)) if sid in graph else []
        
        # Get risk score
        risk = risk_scores.get(sid, 0)
        
        # Generate brief
        if include_brief and intel_generator:
            try:
                brief = intel_generator.generate_brief(name, risk, ring, connections)
            except Exception as e:
                logger.warning(f"Failed to generate brief for {name}: {e}")
                brief = "Intelligence brief unavailable"
        else:
            brief = "Brief generation disabled"
        
        results.append(SuspectAnalysis(
            suspect=sid,
            name=name,
            risk=risk,
            ring=ring,
            connections=connections,
            ai_brief=brief
        ))
    
    # Convert rings to string keys for JSON
    rings_str = {str(k): v for k, v in rings.items()}
    
    elapsed = time.time() - start_time
    logger.info(f"Full analysis completed in {elapsed:.2f} seconds")
    
    return AnalysisResponse(
        kingpins=kingpins,
        rings=rings_str,
        analysis=results,
        summary={
            "total_suspects": len(results),
            "total_rings": len(rings),
            "analysis_time_seconds": round(elapsed, 2)
        }
    )


@app.get("/kingpins", response_model=KingpinResponse)
def get_kingpins(
    n: int = Query(MAX_KINGPINS, ge=1, le=50, description="Number of kingpins to return"),
    include_metrics: bool = Query(True, description="Include detailed metrics")
):
    """Get top kingpins in the network."""
    graph = GRAPH_CACHE.get('graph')
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not loaded")
    
    analyzer = KingpinAnalyzer(graph)
    kingpins = analyzer.get_top_kingpins(n=n, include_metrics=include_metrics)
    
    return KingpinResponse(
        kingpins=kingpins,
        total_nodes=graph.number_of_nodes()
    )


@app.get("/rings", response_model=RingsResponse)
def get_rings(
    method: str = Query("community", description="Detection method: community, kmeans, hierarchical")
):
    """Detect fraud rings in the network."""
    graph = GRAPH_CACHE.get('graph')
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not loaded")
    
    detector = FraudRingDetector(graph)
    
    if method == "kmeans":
        rings = detector.detect_kmeans()
    elif method == "hierarchical":
        rings = detector.detect_hierarchical()
    else:
        rings = detector.detect_community()
    
    stats = detector.get_ring_statistics(rings)
    rings_str = {str(k): v for k, v in rings.items()}
    
    return RingsResponse(
        rings=rings_str,
        ring_statistics=stats
    )


@app.get("/risk", response_model=RiskResponse)
def get_risk_scores(
    threshold: float = Query(0.7, ge=0, le=1, description="High-risk threshold")
):
    """Get risk scores for all nodes."""
    graph = GRAPH_CACHE.get('graph')
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not loaded")
    
    scorer = RiskScorer(graph)
    training_info = scorer.train()
    scores = scorer.score_nodes()
    summary = scorer.get_risk_summary()
    high_risk = scorer.get_high_risk_nodes(threshold=threshold)
    
    return RiskResponse(
        risk_scores=scores,
        summary={**summary, "training": training_info},
        high_risk_nodes=high_risk
    )


@app.post("/brief")
def generate_intelligence_brief(request: BriefRequest):
    """Generate an intelligence brief for a specific suspect."""
    generator = IntelligenceGenerator()
    
    try:
        brief = generator.generate_brief(
            name=request.name,
            risk_score=request.risk_score,
            ring=request.ring,
            connections=request.connections
        )
        
        return {
            "suspect_id": request.suspect_id,
            "name": request.name,
            "brief": brief
        }
    except Exception as e:
        logger.error(f"Failed to generate brief: {e}")
        raise HTTPException(status_code=500, detail=f"Brief generation failed: {str(e)}")


@app.get("/graph/stats")
def get_graph_statistics():
    """Get network graph statistics."""
    graph = GRAPH_CACHE.get('graph')
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not loaded")
    
    builder = GraphBuilder()
    builder.graph = graph
    stats = builder.get_graph_stats()
    
    return {
        "statistics": stats,
        "nodes": list(graph.nodes()),
        "edge_count": graph.number_of_edges()
    }


@app.post("/reload")
def reload_data():
    """Reload data from files."""
    try:
        suspects, calls, transactions = load_or_generate_data()
        graph = build_graph(calls, transactions)
        
        GRAPH_CACHE['graph'] = graph
        GRAPH_CACHE['suspects'] = suspects
        GRAPH_CACHE['calls'] = calls
        GRAPH_CACHE['transactions'] = transactions
        
        return {
            "status": "reloaded",
            "nodes": graph.number_of_nodes(),
            "edges": graph.number_of_edges(),
            "suspects": len(suspects)
        }
    except Exception as e:
        logger.error(f"Reload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Reload failed: {str(e)}")


@app.get("/load-data-chunks")
def load_data_chunks(chunksize: int = Query(DATA_CHUNK_SIZE, ge=1000, le=50000, description="Number of rows to load per chunk")):
    """
    Load data in chunks of up to 10,000 rows at a time.
    
    This endpoint is optimized for large datasets and demonstrates
    the ML engine's ability to handle high-volume data efficiently.
    """
    suspects, calls, transactions = load_or_generate_data_in_chunks(chunksize=chunksize)
    
    # Update cache with new data
    graph = build_graph(calls, transactions)
    GRAPH_CACHE['graph'] = graph
    GRAPH_CACHE['suspects'] = suspects
    GRAPH_CACHE['calls'] = calls
    GRAPH_CACHE['transactions'] = transactions
    
    return {
        "status": "success",
        "message": f"Data loaded successfully with chunk size of {chunksize}",
        "data_summary": {
            "suspects_count": len(suspects),
            "calls_count": len(calls),
            "transactions_count": len(transactions),
            "graph_nodes": graph.number_of_nodes(),
            "graph_edges": graph.number_of_edges()
        },
        "chunk_size": chunksize
    }


@app.get("/demo")
def demo_analysis():
    """
    Quick demo endpoint to show the ML engine is working.
    
    Use this to demonstrate to your team that the system is operational.
    """
    graph = GRAPH_CACHE.get('graph')
    if not graph:
        suspects, calls, transactions = load_or_generate_data()
        graph = build_graph(calls, transactions)
        GRAPH_CACHE['graph'] = graph
        GRAPH_CACHE['suspects'] = suspects
    
    # Quick analysis
    kingpin_analyzer = KingpinAnalyzer(graph)
    top_kingpins = kingpin_analyzer.get_top_kingpins(n=5, include_metrics=True)
    
    ring_detector = FraudRingDetector(graph)
    rings = ring_detector.detect_community()
    
    risk_scorer = RiskScorer(graph)
    risk_scorer.train()
    risk_summary = risk_scorer.get_risk_summary()
    
    return {
        "status": "ML Engine Working Successfully!",
        "message": "Cybercrime Intelligence System is operational",
        "demo_results": {
            "top_5_kingpins": top_kingpins,
            "detected_rings": len(rings),
            "risk_summary": risk_summary,
            "total_nodes_analyzed": graph.number_of_nodes(),
            "total_edges_analyzed": graph.number_of_edges()
        },
        "api_endpoints": [
            {"endpoint": "/", "description": "Health check"},
            {"endpoint": "/health", "description": "Detailed health status"},
            {"endpoint": "/analyze", "description": "Full network analysis"},
            {"endpoint": "/kingpins", "description": "Get top kingpins"},
            {"endpoint": "/rings", "description": "Detect fraud rings"},
            {"endpoint": "/risk", "description": "Risk scoring"},
            {"endpoint": "/brief", "description": "Generate AI intelligence brief"},
            {"endpoint": "/load-data-chunks", "description": "Load data in 10,000 row chunks"},
            {"endpoint": "/demo", "description": "Quick demo (this endpoint)"}
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
