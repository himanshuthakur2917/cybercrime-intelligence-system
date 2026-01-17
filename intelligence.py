"""
Intelligence Briefing Module
=============================
Generates AI-powered intelligence briefings using Google Gemini API.
"""
import logging
from typing import Dict, List, Any, Optional
import requests
from dataclasses import dataclass

from config import GEMINI_API_KEY, GEMINI_URL

logger = logging.getLogger(__name__)


@dataclass
class IntelligenceBrief:
    """Structured intelligence briefing."""
    suspect_name: str
    risk_level: str
    summary: str
    key_findings: List[str]
    recommendations: List[str]
    raw_text: str


class IntelligenceGenerator:
    """Generates AI-powered intelligence briefings."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the intelligence generator.
        
        Args:
            api_key: Gemini API key (uses config default if not provided)
        """
        self.api_key = api_key or GEMINI_API_KEY
        self.api_url = GEMINI_URL
    
    def _create_prompt(
        self,
        name: str,
        risk_score: float,
        ring: str,
        connections: List[str],
        additional_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a structured prompt for the AI."""
        risk_level = "HIGH" if risk_score >= 0.7 else "MEDIUM" if risk_score >= 0.4 else "LOW"
        
        prompt = f"""You are an intelligence analyst preparing a briefing for law enforcement.
Generate a concise, professional intelligence briefing for the following suspect:

SUSPECT PROFILE:
- Name: {name}
- Risk Score: {risk_score:.2%}
- Risk Level: {risk_level}
- Network Ring: {ring}
- Known Connections: {', '.join(connections) if connections else 'None identified'}
"""
        
        if additional_context:
            prompt += "\nADDITIONAL CONTEXT:\n"
            for key, value in additional_context.items():
                prompt += f"- {key}: {value}\n"
        
        prompt += """
Please provide:
1. A 2-3 sentence executive summary
2. 3-5 key intelligence findings
3. 2-3 recommended actions for investigators

Format as a professional intelligence brief. Be specific but avoid speculation beyond the data provided.
"""
        return prompt
    
    def _call_gemini_api(self, prompt: str) -> Optional[str]:
        """Make API call to Gemini."""
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
                "topP": 0.9
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            
            if "candidates" in data and len(data["candidates"]) > 0:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                logger.warning("No candidates in Gemini response")
                return None
                
        except requests.exceptions.Timeout:
            logger.error("Gemini API request timed out")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Gemini API request failed: {e}")
            return None
        except (KeyError, IndexError) as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            return None
    
    def generate_brief(
        self,
        name: str,
        risk_score: float,
        ring: str,
        connections: List[str],
        additional_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate an intelligence briefing for a suspect.
        
        Args:
            name: Suspect name
            risk_score: Risk score (0-1)
            ring: Ring/group identifier
            connections: List of connected nodes
            additional_context: Additional context data
            
        Returns:
            Generated intelligence brief text
        """
        prompt = self._create_prompt(name, risk_score, ring, connections, additional_context)
        
        result = self._call_gemini_api(prompt)
        
        if result:
            logger.info(f"Generated intelligence brief for {name}")
            return result
        else:
            # Fallback to template-based brief
            return self._generate_fallback_brief(name, risk_score, ring, connections)
    
    def _generate_fallback_brief(
        self,
        name: str,
        risk_score: float,
        ring: str,
        connections: List[str]
    ) -> str:
        """Generate a template-based brief when API is unavailable."""
        risk_level = "HIGH" if risk_score >= 0.7 else "MEDIUM" if risk_score >= 0.4 else "LOW"
        
        brief = f"""INTELLIGENCE BRIEFING
=====================

SUBJECT: {name}
RISK ASSESSMENT: {risk_level} ({risk_score:.1%})
NETWORK AFFILIATION: {ring}

EXECUTIVE SUMMARY:
Subject {name} has been identified with a {risk_level.lower()} risk score of {risk_score:.1%}. 
Analysis indicates association with {ring}. Network analysis has identified {len(connections)} direct connections.

KEY FINDINGS:
1. Subject demonstrates {risk_level.lower()} risk indicators based on network analysis
2. Connected to {len(connections)} other entities in the network
3. Associated with {ring} based on community detection algorithms

KNOWN CONNECTIONS:
{', '.join(connections) if connections else 'No direct connections identified'}

RECOMMENDATIONS:
1. Continue monitoring subject's network activity
2. Investigate connections for additional intelligence
3. Cross-reference with existing case files

---
Note: This is an automated briefing. AI-enhanced analysis unavailable.
"""
        return brief
    
    def generate_network_summary(
        self,
        kingpins: List[Dict[str, Any]],
        rings: Dict[int, List[str]],
        high_risk_nodes: List[str]
    ) -> str:
        """
        Generate a summary of the entire network.
        
        Args:
            kingpins: List of top kingpins
            rings: Dictionary of detected rings
            high_risk_nodes: List of high-risk node IDs
            
        Returns:
            Network summary text
        """
        prompt = f"""You are an intelligence analyst. Generate a brief executive summary of a criminal network analysis.

NETWORK ANALYSIS RESULTS:
- Top Kingpins: {[k.get('node', k) for k in kingpins[:5]] if kingpins else 'None identified'}
- Number of Rings/Groups: {len(rings)}
- Ring Sizes: {[len(members) for members in rings.values()]}
- High Risk Individuals: {len(high_risk_nodes)}

Provide a 3-4 sentence executive summary suitable for law enforcement leadership.
"""
        
        result = self._call_gemini_api(prompt)
        
        if result:
            return result
        
        # Fallback summary
        return f"""NETWORK ANALYSIS SUMMARY
========================
Analysis identified {len(kingpins)} potential key players in the network, with {len(rings)} distinct groups detected.
{len(high_risk_nodes)} individuals flagged as high-risk based on their network position and activity patterns.
The largest group contains {max(len(m) for m in rings.values()) if rings else 0} members.
Recommend prioritizing investigation of identified kingpins and high-risk individuals."""


def generate_brief(
    name: str,
    risk_score: float,
    ring: str,
    connections: List[str]
) -> str:
    """
    Convenience function to generate an intelligence brief.
    
    Args:
        name: Suspect name
        risk_score: Risk score (0-1)
        ring: Ring identifier
        connections: List of connections
        
    Returns:
        Generated brief text
    """
    generator = IntelligenceGenerator()
    return generator.generate_brief(name, risk_score, ring, connections)
