"""
Kingpin Detection Module
========================
Identifies key players (kingpins) in criminal networks using graph centrality metrics.
"""
import logging
from typing import Dict, List, Tuple, Optional, Any
import networkx as nx

from config import PAGERANK_WEIGHT, BETWEENNESS_WEIGHT, MAX_KINGPINS

logger = logging.getLogger(__name__)


class KingpinAnalyzer:
    """Analyzes network graphs to identify influential nodes (kingpins)."""
    
    def __init__(self, graph: nx.Graph):
        """
        Initialize the analyzer with a network graph.
        
        Args:
            graph: NetworkX graph to analyze
        """
        self.graph = graph
        self._pagerank: Optional[Dict[str, float]] = None
        self._betweenness: Optional[Dict[str, float]] = None
        self._degree_centrality: Optional[Dict[str, float]] = None
        self._closeness: Optional[Dict[str, float]] = None
        self._eigenvector: Optional[Dict[str, float]] = None
    
    def compute_pagerank(self, alpha: float = 0.85) -> Dict[str, float]:
        """Compute PageRank centrality for all nodes."""
        if self._pagerank is None:
            try:
                self._pagerank = nx.pagerank(self.graph, alpha=alpha)
                logger.debug("PageRank computed successfully")
            except nx.NetworkXException as e:
                logger.warning(f"PageRank computation failed: {e}")
                self._pagerank = {n: 1.0 / self.graph.number_of_nodes() 
                                  for n in self.graph.nodes()}
        return self._pagerank
    
    def compute_betweenness(self, normalized: bool = True) -> Dict[str, float]:
        """Compute betweenness centrality for all nodes."""
        if self._betweenness is None:
            self._betweenness = nx.betweenness_centrality(self.graph, normalized=normalized)
            logger.debug("Betweenness centrality computed successfully")
        return self._betweenness
    
    def compute_degree_centrality(self) -> Dict[str, float]:
        """Compute degree centrality for all nodes."""
        if self._degree_centrality is None:
            self._degree_centrality = nx.degree_centrality(self.graph)
        return self._degree_centrality
    
    def compute_closeness(self) -> Dict[str, float]:
        """Compute closeness centrality for all nodes."""
        if self._closeness is None:
            self._closeness = nx.closeness_centrality(self.graph)
        return self._closeness
    
    def compute_eigenvector(self, max_iter: int = 1000) -> Dict[str, float]:
        """Compute eigenvector centrality for all nodes."""
        if self._eigenvector is None:
            try:
                self._eigenvector = nx.eigenvector_centrality(
                    self.graph, max_iter=max_iter
                )
            except nx.NetworkXException:
                logger.warning("Eigenvector centrality failed, using degree centrality fallback")
                self._eigenvector = self.compute_degree_centrality()
        return self._eigenvector
    
    def compute_kingpin_scores(
        self, 
        pagerank_weight: float = PAGERANK_WEIGHT,
        betweenness_weight: float = BETWEENNESS_WEIGHT
    ) -> Dict[str, float]:
        """
        Compute composite kingpin scores combining multiple centrality measures.
        
        Args:
            pagerank_weight: Weight for PageRank in composite score
            betweenness_weight: Weight for betweenness in composite score
            
        Returns:
            Dictionary mapping node IDs to kingpin scores
        """
        pagerank = self.compute_pagerank()
        betweenness = self.compute_betweenness()
        
        scores = {}
        for node in self.graph.nodes():
            score = (pagerank_weight * pagerank.get(node, 0) + 
                    betweenness_weight * betweenness.get(node, 0))
            scores[node] = round(score, 6)
        
        logger.info(f"Computed kingpin scores for {len(scores)} nodes")
        return scores
    
    def get_top_kingpins(
        self, 
        n: int = MAX_KINGPINS,
        include_metrics: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get the top N kingpins with their scores.
        
        Args:
            n: Number of top kingpins to return
            include_metrics: Whether to include detailed metrics
            
        Returns:
            List of dictionaries with kingpin information
        """
        scores = self.compute_kingpin_scores()
        sorted_nodes = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
        
        if not include_metrics:
            return [{"node": node, "score": score} for node, score in sorted_nodes]
        
        # Include detailed metrics
        pagerank = self.compute_pagerank()
        betweenness = self.compute_betweenness()
        degree = self.compute_degree_centrality()
        
        result = []
        for rank, (node, score) in enumerate(sorted_nodes, 1):
            result.append({
                "rank": rank,
                "node": node,
                "kingpin_score": score,
                "pagerank": round(pagerank.get(node, 0), 6),
                "betweenness": round(betweenness.get(node, 0), 6),
                "degree_centrality": round(degree.get(node, 0), 6),
                "connections": list(self.graph.neighbors(node))
            })
        
        return result
    
    def get_all_centralities(self) -> Dict[str, Dict[str, float]]:
        """Get all centrality measures for comparison."""
        return {
            "pagerank": self.compute_pagerank(),
            "betweenness": self.compute_betweenness(),
            "degree": self.compute_degree_centrality(),
            "closeness": self.compute_closeness(),
            "eigenvector": self.compute_eigenvector()
        }


def get_kingpin_scores(G: nx.Graph) -> List[Tuple[str, float]]:
    """
    Convenience function to get kingpin scores from a graph.
    
    Args:
        G: NetworkX graph
        
    Returns:
        Sorted list of (node, score) tuples
    """
    analyzer = KingpinAnalyzer(G)
    scores = analyzer.compute_kingpin_scores()
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
