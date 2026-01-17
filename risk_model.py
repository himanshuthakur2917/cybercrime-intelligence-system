"""
Risk Scoring Model Module
=========================
Machine learning-based risk scoring for suspects in the network.
"""
import logging
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import networkx as nx
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score

from config import RANDOM_STATE, RISK_THRESHOLD

logger = logging.getLogger(__name__)


class RiskScorer:
    """Machine learning-based risk scoring for network nodes."""
    
    def __init__(self, graph: nx.Graph):
        """
        Initialize the risk scorer with a network graph.
        
        Args:
            graph: NetworkX graph to analyze
        """
        self.graph = graph
        self.nodes = list(graph.nodes())
        self.model: Optional[RandomForestClassifier] = None
        self.scaler = StandardScaler()
        self._features: Optional[np.ndarray] = None
        self._feature_names: List[str] = []
    
    def _compute_features(self) -> Tuple[np.ndarray, List[str]]:
        """
        Compute feature matrix for all nodes.
        
        Returns:
            Tuple of (feature matrix, feature names)
        """
        if self._features is not None:
            return self._features, self._feature_names
        
        features = []
        
        # Precompute centrality measures
        pagerank = nx.pagerank(self.graph)
        betweenness = nx.betweenness_centrality(self.graph)
        closeness = nx.closeness_centrality(self.graph)
        clustering = nx.clustering(self.graph)
        degree_centrality = nx.degree_centrality(self.graph)
        
        for node in self.nodes:
            node_features = []
            
            # Degree-based features
            degree = self.graph.degree(node)
            node_features.append(degree)
            
            # Centrality features
            node_features.append(pagerank.get(node, 0))
            node_features.append(betweenness.get(node, 0))
            node_features.append(closeness.get(node, 0))
            node_features.append(clustering.get(node, 0))
            node_features.append(degree_centrality.get(node, 0))
            
            # Edge weight features
            edges = list(self.graph.edges(node, data=True))
            weights = [e[2].get('weight', 1) for e in edges]
            amounts = [e[2].get('total_amount', 0) for e in edges]
            
            if weights:
                node_features.extend([
                    np.mean(weights),
                    np.std(weights) if len(weights) > 1 else 0,
                    np.max(weights),
                    np.sum(weights)
                ])
            else:
                node_features.extend([0, 0, 0, 0])
            
            if amounts and any(a > 0 for a in amounts):
                valid_amounts = [a for a in amounts if a > 0]
                node_features.extend([
                    np.mean(valid_amounts) if valid_amounts else 0,
                    np.max(valid_amounts) if valid_amounts else 0,
                    np.sum(valid_amounts) if valid_amounts else 0
                ])
            else:
                node_features.extend([0, 0, 0])
            
            # Neighbor features
            neighbors = list(self.graph.neighbors(node))
            neighbor_degrees = [self.graph.degree(n) for n in neighbors]
            node_features.append(np.mean(neighbor_degrees) if neighbor_degrees else 0)
            node_features.append(len(neighbors))
            
            features.append(node_features)
        
        self._feature_names = [
            'degree', 'pagerank', 'betweenness', 'closeness', 'clustering',
            'degree_centrality', 'weight_mean', 'weight_std', 'weight_max',
            'weight_sum', 'amount_mean', 'amount_max', 'amount_sum',
            'neighbor_avg_degree', 'num_neighbors'
        ]
        
        self._features = np.array(features)
        return self._features, self._feature_names
    
    def _create_labels(self, X: np.ndarray) -> np.ndarray:
        """
        Create pseudo-labels based on feature heuristics.
        High-risk nodes have high degree and high centrality.
        """
        # Use combination of features to create labels
        degree_col = X[:, 0]  # degree
        pagerank_col = X[:, 1]  # pagerank
        amount_col = X[:, 12] if X.shape[1] > 12 else np.zeros(len(X))  # amount_sum
        
        # Normalize each column
        def normalize(arr):
            if arr.max() == arr.min():
                return np.zeros_like(arr)
            return (arr - arr.min()) / (arr.max() - arr.min())
        
        combined = normalize(degree_col) * 0.4 + normalize(pagerank_col) * 0.3 + normalize(amount_col) * 0.3
        
        # Binary labels based on median
        threshold = np.median(combined)
        labels = (combined > threshold).astype(int)
        
        return labels
    
    def train(self, use_gradient_boost: bool = False) -> Dict[str, Any]:
        """
        Train the risk model.
        
        Args:
            use_gradient_boost: Use GradientBoosting instead of RandomForest
            
        Returns:
            Dictionary with training metrics
        """
        X, feature_names = self._compute_features()
        
        if len(X) < 2:
            logger.warning("Not enough data to train model")
            return {"status": "insufficient_data"}
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(X)
        
        # Create pseudo-labels
        y = self._create_labels(X)
        
        # Check for single class
        if len(np.unique(y)) < 2:
            logger.warning("Only one class in labels, adjusting...")
            y[0] = 1 - y[0]  # Flip first label to ensure two classes
        
        # Initialize model
        if use_gradient_boost:
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                random_state=RANDOM_STATE,
                max_depth=5
            )
        else:
            self.model = RandomForestClassifier(
                n_estimators=100,
                random_state=RANDOM_STATE,
                max_depth=10,
                min_samples_split=2
            )
        
        # Train model
        self.model.fit(X_scaled, y)
        
        # Cross-validation score
        cv_scores = cross_val_score(self.model, X_scaled, y, cv=min(3, len(X)))
        
        # Feature importance
        importances = dict(zip(feature_names, self.model.feature_importances_))
        top_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
        
        logger.info(f"Model trained with CV score: {np.mean(cv_scores):.3f}")
        
        return {
            "status": "trained",
            "cv_score_mean": round(float(np.mean(cv_scores)), 3),
            "cv_score_std": round(float(np.std(cv_scores)), 3),
            "top_features": top_features,
            "n_samples": len(X)
        }
    
    def score_nodes(self) -> Dict[str, float]:
        """
        Score all nodes for risk.
        
        Returns:
            Dictionary mapping node IDs to risk scores (0-1)
        """
        if self.model is None:
            self.train()
        
        X, _ = self._compute_features()
        X_scaled = self.scaler.transform(X)
        
        # Get probability of high-risk class
        probs = self.model.predict_proba(X_scaled)
        
        risk_scores = {}
        for i, node in enumerate(self.nodes):
            # Probability of class 1 (high risk)
            risk = float(probs[i][1]) if probs.shape[1] > 1 else float(probs[i][0])
            risk_scores[node] = round(risk, 4)
        
        logger.info(f"Scored {len(risk_scores)} nodes for risk")
        return risk_scores
    
    def get_high_risk_nodes(self, threshold: float = RISK_THRESHOLD) -> List[Dict[str, Any]]:
        """
        Get nodes with risk score above threshold.
        
        Args:
            threshold: Risk score threshold (0-1)
            
        Returns:
            List of high-risk nodes with details
        """
        scores = self.score_nodes()
        high_risk = []
        
        for node, score in scores.items():
            if score >= threshold:
                high_risk.append({
                    "node": node,
                    "risk_score": score,
                    "degree": self.graph.degree(node),
                    "connections": list(self.graph.neighbors(node))
                })
        
        return sorted(high_risk, key=lambda x: x['risk_score'], reverse=True)
    
    def get_risk_summary(self) -> Dict[str, Any]:
        """Get summary statistics of risk scores."""
        scores = self.score_nodes()
        score_values = list(scores.values())
        
        return {
            "total_nodes": len(scores),
            "mean_risk": round(float(np.mean(score_values)), 4),
            "median_risk": round(float(np.median(score_values)), 4),
            "max_risk": round(float(np.max(score_values)), 4),
            "min_risk": round(float(np.min(score_values)), 4),
            "high_risk_count": sum(1 for s in score_values if s >= RISK_THRESHOLD),
            "risk_distribution": {
                "low": sum(1 for s in score_values if s < 0.3),
                "medium": sum(1 for s in score_values if 0.3 <= s < 0.7),
                "high": sum(1 for s in score_values if s >= 0.7)
            }
        }


def train_and_score(G: nx.Graph) -> Dict[str, float]:
    """
    Convenience function to train model and score nodes.
    
    Args:
        G: NetworkX graph
        
    Returns:
        Dictionary mapping node IDs to risk scores
    """
    scorer = RiskScorer(G)
    scorer.train()
    return scorer.score_nodes()
