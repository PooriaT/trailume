from datetime import datetime, time

from fastapi import APIRouter, HTTPException, Request

from app.api.errors import strava_http_exception
from app.api.session import get_strava_activity_session_or_error
from app.models.contracts import RecapGenerateRequest, RecapGenerateResponse
from app.services.analytics.engine import AnalyticsEngine
from app.services.narrative.models import NarrativeInput
from app.services.narrative.service import NarrativeService
from app.services.strava.client import StravaAPIError, StravaService
from app.services.strava.token_store import strava_token_store

router = APIRouter(tags=["recaps"])


@router.post("/recaps/generate", response_model=RecapGenerateResponse)
def generate_recap(request: Request, payload: RecapGenerateRequest) -> RecapGenerateResponse:
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="endDate must be on or after startDate")

    session_id, session = get_strava_activity_session_or_error(request)

    strava_service = StravaService()
    analytics = AnalyticsEngine()
    narrative_service = NarrativeService()

    start_dt = datetime.combine(payload.start_date, time.min)
    end_dt = datetime.combine(payload.end_date, time.max)

    try:
        tokens = strava_service.ensure_valid_tokens(session.tokens)
        if tokens.access_token != session.tokens.access_token:
            strava_token_store.update_tokens(session_id, tokens)

        activities = strava_service.fetch_activities(
            access_token=tokens.access_token,
            start_date=start_dt,
            end_date=end_dt,
            activity_type=payload.activity_type,
        )
    except StravaAPIError as exc:
        raise strava_http_exception(exc) from exc

    insights = analytics.build_insights(
        activities,
        payload.activity_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )

    narrative = narrative_service.generate(
        NarrativeInput(
            recap_title=insights.title,
            summary_metrics=insights.summary_metrics,
            highlight_cards=insights.highlight_cards,
            insight_flags=insights.insight_flags,
            metadata=insights.metadata,
        )
    )

    return RecapGenerateResponse(
        title=insights.title,
        narrative={
            "title": narrative.title,
            "summary": narrative.summary,
            "highlights": narrative.highlights,
            "reflection": narrative.reflection,
            "source": narrative.source,
        },
        summaryMetrics=insights.summary_metrics,
        keyMetrics=insights.key_metrics,
        highlightCards=insights.highlight_cards,
        chartPoints=insights.chart_points,
        trendSeries=insights.trend_series,
        standoutActivities=insights.standout_activities,
        mapData=insights.map_data,
        insightFlags=insights.insight_flags,
        metadata=insights.metadata,
    )
