"""
Fraud Ring Detection Module
============================
Detects potential fraud rings using graph clustering and community detection.
"""
import logging
from typing import Dict, List, Any, Optional
import numpy as np
import networkx as nx
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.preprocessing import StandardScaler
from joblib import Parallel, delayed

from config import N_CLUSTERS, MIN_RING_SIZE, RANDOM_STATE

logger = logging.getLogger(__name__)


class FraudRingDetector:
    """Detects fraud rings in network graphs using multiple clustering methods."""
    
    def __init__(self, graph: nx.Graph):
        """
        Initialize the detector with a network graph.
        
        Args:
            graph: NetworkX graph to analyze
        """
        self.graph = graph
        self.nodes = list(graph.nodes())
        self._adjacency_matrix: Optional[np.ndarray] = None
        self._feature_matrix: Optional[np.ndarray] = None
    
    def _get_adjacency_matrix(self) -> np.ndarray:
        """Get the adjacency matrix of the graph."""
        if self._adjacency_matrix is None:
            self._adjacency_matrix = nx.to_numpy_array(self.graph, nodelist=self.nodes)
        return self._adjacency_matrix
    
    def _compute_node_features(self) -> np.ndarray:
        """Compute feature vectors for each node."""
        if self._feature_matrix is not None:
            return self._feature_matrix
        
        features = []
        pagerank = nx.pagerank(self.graph)
        betweenness = nx.betweenness_centrality(self.graph)
        clustering_coef = nx.clustering(self.graph)
        
        for node in self.nodes:
            node_features = [
                self.graph.degree(node),
                pagerank.get(node, 0),
                betweenness.get(node, 0),
                clustering_coef.get(node, 0),
            ]
            
            # Add edge weight statistics
            edges = self.graph.edges(node, data=True)
            weights = [e[2].get('weight', 1) for e in edges]
            if weights:
                node_features.extend([
                    np.mean(weights),
                    np.std(weights) if len(weights) > 1 else 0,
                    np.max(weights),
                    len(weights)
                ])
            else:
                node_features.extend([0, 0, 0, 0])
            
            features.append(node_features)
        
        self._feature_matrix = np.array(features)
        return self._feature_matrix
    
    def _compute_node_features_parallel(self) -> np.ndarray:
        """Compute node features in parallel."""
        def compute_features(node):
            # Compute features for a single node
            features = [
                self.graph.degree(node),
                pagerank.get(node, 0),
                betweenness.get(node, 0),
                clustering_coef.get(node, 0),
            ]
            
            # Add edge weight statistics
            edges = self.graph.edges(node, data=True)
            weights = [e[2].get('weight', 1) for e in edges]
            if weights:
                features.extend([
                    np.mean(weights),
                    np.std(weights) if len(weights) > 1 else 0,
                    np.max(weights),
                    len(weights)
                ])
            else:
                features.extend([0, 0, 0, 0])
            
            return features
        
        pagerank = nx.pagerank(self.graph)
        betweenness = nx.betweenness_centrality(self.graph)
        clustering_coef = nx.clustering(self.graph)
        
        features = Parallel(n_jobs=-1)(delayed(compute_features)(node) for node in self.nodes)
        self._feature_matrix = np.array(features)
        return self._feature_matrix
    
    def detect_kmeans(self, n_clusters: int = N_CLUSTERS) -> Dict[int, List[str]]:
        """
        Detect rings using K-Means clustering on adjacency matrix.
        
        Args:
            n_clusters: Number of clusters to find
            
        Returns:
            Dictionary mapping ring ID to list of member nodes
        """
        if len(self.nodes) < n_clusters:
            logger.warning(f"Not enough nodes ({len(self.nodes)}) for {n_clusters} clusters")
            return {0: self.nodes}
        
        X = self._get_adjacency_matrix()
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=RANDOM_STATE, n_init=10)
        labels = kmeans.fit_predict(X)
        
        rings = {}
        for i, node in enumerate(self.nodes):
            ring_id = int(labels[i])
            rings.setdefault(ring_id, []).append(node)
        
        logger.info(f"K-Means detected {len(rings)} rings")
        return rings
    
    def detect_community(self) -> Dict[int, List[str]]:
        """
        Detect rings using Louvain community detection.
        
        Returns:
            Dictionary mapping ring ID to list of member nodes
        """
        try:
            communities = nx.community.louvain_communities(self.graph, seed=RANDOM_STATE)
            rings = {i: list(comm) for i, comm in enumerate(communities)}
            logger.info(f"Community detection found {len(rings)} communities")
            return rings
        except Exception as e:
            logger.warning(f"Community detection failed: {e}, falling back to K-Means")
            return self.detect_kmeans()
    
    def detect_dbscan(self, eps: float = 0.5, min_samples: int = 2) -> Dict[int, List[str]]:
        """
        Detect rings using DBSCAN clustering on node features.
        
        Args:
            eps: Maximum distance between samples
            min_samples: Minimum samples in a cluster
            
        Returns:
            Dictionary mapping ring ID to list of member nodes
        """
        X = self._compute_node_features()
        
        # Normalize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        dbscan = DBSCAN(eps=eps, min_samples=min_samples)
        labels = dbscan.fit_predict(X_scaled)
        
        rings = {}
        noise_nodes = []
        
        for i, node in enumerate(self.nodes):
            label = int(labels[i])
            if label == -1:
                noise_nodes.append(node)
            else:
                rings.setdefault(label, []).append(node)
        
        # Add noise nodes as isolated "ring"
        if noise_nodes:
            rings[-1] = noise_nodes
        
        logger.info(f"DBSCAN detected {len(rings)} clusters ({len(noise_nodes)} noise nodes)")
        return rings
    
    def detect_hierarchical(self, n_clusters: int = N_CLUSTERS) -> Dict[int, List[str]]:
        """
        Detect rings using hierarchical clustering.
        
        Args:
            n_clusters: Number of clusters to find
            
        Returns:
            Dictionary mapping ring ID to list of member nodes
        """
        if len(self.nodes) < n_clusters:
            return {0: self.nodes}
        
        X = self._compute_node_features()
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        clustering = AgglomerativeClustering(n_clusters=n_clusters)
        labels = clustering.fit_predict(X_scaled)
        
        rings = {}
        for i, node in enumerate(self.nodes):
            ring_id = int(labels[i])
            rings.setdefault(ring_id, []).append(node)
        
        logger.info(f"Hierarchical clustering detected {len(rings)} rings")
        return rings
    
    def get_ring_statistics(self, rings: Dict[int, List[str]]) -> List[Dict[str, Any]]:
        """
        Calculate statistics for each detected ring.
        
        Args:
            rings: Dictionary of rings from detection method
            
        Returns:
            List of dictionaries with ring statistics
        """
        stats = []
        
        for ring_id, members in rings.items():
            if len(members) < MIN_RING_SIZE:
                continue
            
            # Get subgraph for this ring
            subgraph = self.graph.subgraph(members)
            
            ring_stats = {
                "ring_id": ring_id,
                "size": len(members),
                "members": members,
                "internal_edges": subgraph.number_of_edges(),
                "density": nx.density(subgraph) if len(members) > 1 else 0,
                "avg_degree": sum(dict(subgraph.degree()).values()) / len(members) if members else 0,
            }
            
            # Calculate total transaction amount within ring
            total_amount = 0
            for u, v, data in subgraph.edges(data=True):
                total_amount += data.get('total_amount', data.get('weight', 0))
            ring_stats["total_internal_amount"] = round(total_amount, 2)
            
            stats.append(ring_stats)
        
        return sorted(stats, key=lambda x: x['size'], reverse=True)
    
    def detect_all_methods(self) -> Dict[str, Dict[int, List[str]]]:
        """Run all detection methods and return results."""
        return {
            "kmeans": self.detect_kmeans(),
            "community": self.detect_community(),
            "hierarchical": self.detect_hierarchical()
        }


def detect_rings(G: nx.Graph) -> Dict[int, List[str]]:
    """
    Convenience function to detect fraud rings.
    
    Args:
        G: NetworkX graph
        
    Returns:
        Dictionary mapping ring ID to list of member nodes
    """
    detector = FraudRingDetector(G)
    return detector.detect_community()
