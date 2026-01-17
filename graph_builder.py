"""
Graph Builder Module
====================
Constructs and manages NetworkX graphs from call and transaction data.
"""
import logging
from typing import Dict, Any, List, Optional
import networkx as nx
import pandas as pd
from joblib import Parallel, delayed

logger = logging.getLogger(__name__)


class GraphBuilder:
    """Builds and analyzes network graphs from communication and transaction data."""
    
    def __init__(self):
        self.graph: Optional[nx.Graph] = None
        self.directed_graph: Optional[nx.DiGraph] = None
    
    def build_graph(self, calls: pd.DataFrame, transactions: pd.DataFrame, 
                    directed: bool = False) -> nx.Graph:
        """
        Build a network graph from calls and transactions.
        
        Args:
            calls: DataFrame with columns [from, to, duration]
            transactions: DataFrame with columns [from, to, amount]
            directed: Whether to create a directed graph
            
        Returns:
            NetworkX graph object
        """
        G = nx.DiGraph() if directed else nx.Graph()
        
        # Add call edges
        call_count = 0
        for _, row in calls.iterrows():
            source, target = str(row["from"]), str(row["to"])
            weight = float(row.get("duration", 1))
            
            if G.has_edge(source, target):
                # Aggregate multiple calls
                G[source][target]["weight"] += weight
                G[source][target]["call_count"] += 1
            else:
                G.add_edge(source, target, weight=weight, edge_type="call", call_count=1)
            call_count += 1
        
        # Add transaction edges
        tx_count = 0
        for _, row in transactions.iterrows():
            source, target = str(row["from"]), str(row["to"])
            amount = float(row.get("amount", 0))
            
            if G.has_edge(source, target):
                # Aggregate multiple transactions
                G[source][target]["total_amount"] = G[source][target].get("total_amount", 0) + amount
                G[source][target]["tx_count"] = G[source][target].get("tx_count", 0) + 1
                # Update edge type to mixed if both call and transaction
                if G[source][target].get("edge_type") == "call":
                    G[source][target]["edge_type"] = "mixed"
            else:
                G.add_edge(source, target, weight=amount, edge_type="transaction", 
                          total_amount=amount, tx_count=1)
            tx_count += 1
        
        logger.info(f"Built graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
        logger.info(f"Processed {call_count} calls and {tx_count} transactions")
        
        # Enhanced logging for graph statistics
        logger.info(f"Graph has {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
        
        if directed:
            self.directed_graph = G
        else:
            self.graph = G
            
        return G
    
    def get_node_attributes(self, node: str) -> Dict[str, Any]:
        """Get all attributes for a specific node."""
        if self.graph is None:
            return {}
        
        if node not in self.graph:
            return {}
            
        return {
            "degree": self.graph.degree(node),
            "neighbors": list(self.graph.neighbors(node)),
            "weighted_degree": sum(d.get("weight", 1) for _, _, d in self.graph.edges(node, data=True))
        }
    
    def get_graph_stats(self) -> Dict[str, Any]:
        """Calculate basic statistics about the graph."""
        if self.graph is None:
            return {}
            
        G = self.graph
        stats = {
            "num_nodes": G.number_of_nodes(),
            "num_edges": G.number_of_edges(),
            "density": nx.density(G),
            "is_connected": nx.is_connected(G) if G.number_of_nodes() > 0 else False,
        }
        
        if G.number_of_nodes() > 0:
            degrees = [d for _, d in G.degree()]
            stats["avg_degree"] = sum(degrees) / len(degrees)
            stats["max_degree"] = max(degrees)
            stats["min_degree"] = min(degrees)
            
            # Connected components
            if not stats["is_connected"]:
                components = list(nx.connected_components(G))
                stats["num_components"] = len(components)
                stats["largest_component_size"] = len(max(components, key=len))
        
        return stats
    
    def get_subgraph(self, nodes: List[str]) -> nx.Graph:
        """Extract a subgraph containing only specified nodes."""
        if self.graph is None:
            return nx.Graph()
        return self.graph.subgraph(nodes).copy()


def build_graph(calls: pd.DataFrame, transactions: pd.DataFrame) -> nx.Graph:
    """
    Convenience function to build a graph from calls and transactions.
    
    Args:
        calls: DataFrame with call data
        transactions: DataFrame with transaction data
        
    Returns:
        NetworkX graph
    """
    builder = GraphBuilder()
    return builder.build_graph(calls, transactions)
