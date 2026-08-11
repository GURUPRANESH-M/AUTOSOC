import httpx
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from autosoc_api.core.config import settings

router = APIRouter()

async def get_opensearch_client() -> httpx.AsyncClient:
    client = httpx.AsyncClient(base_url=settings.OPENSEARCH_HOSTS)
    try:
        yield client
    finally:
        await client.aclose()

@router.get("/dashboard/summary", response_model=Dict[str, Any])
async def get_dashboard_summary(
    client: httpx.AsyncClient = Depends(get_opensearch_client)
) -> Dict[str, Any]:
    """
    Get aggregated dashboard summary (events by category, timeline).
    """
    query = {
        "size": 0,
        "query": {
            "range": {
                "event_time": {
                    "gte": "now-24h/h",
                    "lte": "now/h"
                }
            }
        },
        "aggs": {
            "categories": {
                "terms": {"field": "event_category", "size": 10}
            },
            "timeline": {
                "date_histogram": {
                    "field": "event_time",
                    "fixed_interval": "1h"
                }
            },
            "sources": {
                "terms": {"field": "source_type", "size": 10}
            }
        }
    }
    
    try:
        resp = await client.post("/autosoc-events-v1-*/_search", json=query)
        resp.raise_for_status()
        data = resp.json()
        
        aggs = data.get("aggregations", {})
        
        return {
            "total_events_24h": data.get("hits", {}).get("total", {}).get("value", 0),
            "categories": [{"category": b["key"], "count": b["doc_count"]} for b in aggs.get("categories", {}).get("buckets", [])],
            "timeline": [{"time": b["key_as_string"], "count": b["doc_count"]} for b in aggs.get("timeline", {}).get("buckets", [])],
            "sources": [{"source": b["key"], "count": b["doc_count"]} for b in aggs.get("sources", {}).get("buckets", [])]
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"OpenSearch upstream error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=Dict[str, Any])
async def search_events(
    category: Optional[str] = Query(None, description="Filter by event category"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    limit: int = Query(50, ge=1, le=1000),
    client: httpx.AsyncClient = Depends(get_opensearch_client)
) -> Dict[str, Any]:
    """
    Query normalized/enriched security events safely without allowing raw Lucene DSL.
    """
    # Build safe OpenSearch query
    must_clauses: List[Dict[str, Any]] = []
    
    if category:
        must_clauses.append({"term": {"event_category": category}})
    if source_ip:
        must_clauses.append({"term": {"source_ip": source_ip}})
        
    query = {
        "size": limit,
        "sort": [{"event_time": {"order": "desc"}}],
        "query": {
            "bool": {
                "must": must_clauses
            }
        } if must_clauses else {"match_all": {}}
    }
    
    try:
        resp = await client.post("/autosoc-events-v1-*/_search", json=query)
        resp.raise_for_status()
        data = resp.json()
        
        hits = data.get("hits", {}).get("hits", [])
        events = [hit["_source"] for hit in hits]
        
        return {
            "total": data.get("hits", {}).get("total", {}).get("value", 0),
            "events": events
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"OpenSearch upstream error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{event_id}", response_model=Dict[str, Any])
async def get_event(
    event_id: str,
    client: httpx.AsyncClient = Depends(get_opensearch_client)
) -> Dict[str, Any]:
    """
    Get a single event by ID.
    """
    query = {
        "query": {
            "term": {
                "normalized_event_id": event_id
            }
        }
    }
    try:
        resp = await client.post("/autosoc-events-v1-*/_search", json=query)
        resp.raise_for_status()
        data = resp.json()
        
        hits = data.get("hits", {}).get("hits", [])
        if not hits:
            raise HTTPException(status_code=404, detail="Event not found")
            
        return hits[0]["_source"]
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"OpenSearch upstream error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
