from datetime import datetime, time

from fastapi import APIRouter

from app.models.contracts import RecapGenerateRequest, RecapGenerateResponse
from app.services.analytics.engine import AnalyticsEngine
from app.services.narrative.ollama import NarrativeService
from app.services.strava.client import StravaService

router = APIRouter(tags=["recaps"])


@router.post("/recaps/generate", response_model=RecapGenerateResponse)
def generate_recap(payload: RecapGenerateRequest) -> RecapGenerateResponse:
    strava_service = StravaService()
    analytics = AnalyticsEngine()
    narrative = NarrativeService()

    start_dt = datetime.combine(payload.start_date, time.min)
    end_dt = datetime.combine(payload.end_date, time.max)

    activities = strava_service.fetch_activities(start_dt, end_dt, payload.activity_type)
    insights = analytics.build_insights(activities, payload.activity_type)
    story, source = narrative.generate(insights.narrative_seed)

    return RecapGenerateResponse(
        title=insights.title,
        narrativeSummary=story,
        narrativeSource=source,
        keyMetrics=insights.key_metrics,
        chartPoints=insights.chart_points,
        standoutActivities=insights.standout_activities,
    )
