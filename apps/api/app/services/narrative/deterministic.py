from __future__ import annotations

from app.services.narrative.models import NarrativeInput, NarrativeOutput


class DeterministicNarrativeProvider:
    provider_name = "fallback"

    def is_available(self) -> bool:
        return True

    def generate(self, payload: NarrativeInput) -> NarrativeOutput:
        metrics = payload.summary_metrics
        metadata = payload.metadata
        flags = payload.insight_flags

        activity_count = int(metrics.get("activityCount", 0) or 0)
        total_distance_km = float(metrics.get("totalDistanceM", 0.0) or 0.0) / 1000
        avg_distance_km = float(metrics.get("averageDistanceM", 0.0) or 0.0) / 1000
        total_elevation_m = metrics.get("totalElevationGainM")
        range_days = int(metadata.get("rangeDays", 0) or 0)

        summary = (
            f"Across {range_days} day{'s' if range_days != 1 else ''}, you logged {activity_count} "
            f"activit{'ies' if activity_count != 1 else 'y'} and covered {total_distance_km:.1f} km "
            f"with an average of {avg_distance_km:.1f} km per activity."
        )

        highlights: list[str] = []
        for card in payload.highlight_cards[:3]:
            highlights.append(
                f"{card.get('title', 'Highlight')}: {card.get('value', 'N/A')} ({card.get('detail', 'No detail')})."
            )

        most_active_day = metadata.get("mostActiveDay")
        if isinstance(most_active_day, dict):
            highlights.append(
                "Most active day: "
                f"{most_active_day.get('date', 'Unknown')} "
                f"with {most_active_day.get('activityCount', 0)} activities."
            )

        trend = flags.get("frequencyTrend", "flat")
        if trend in {"increasing", "decreasing", "flat"}:
            highlights.append(f"Training frequency trend: {trend}.")

        backup_highlights = [
            f"Total elevation gain: {float(total_elevation_m or 0):.0f} m.",
            f"Coverage window: {range_days} day{'s' if range_days != 1 else ''}.",
            f"Total distance: {total_distance_km:.1f} km.",
            f"Activity count: {activity_count}.",
        ]
        for fallback_highlight in backup_highlights:
            if len(highlights) >= 5:
                break
            if fallback_highlight not in highlights:
                highlights.append(fallback_highlight)

        highlights = highlights[:5]
        if len(highlights) < 3:
            raise ValueError("Deterministic narrative must produce at least 3 highlights")

        reflection_parts = [
            f"This recap stays focused on recorded metrics for {metadata.get('selectedActivityType', 'all')} activities."
        ]
        if flags.get("hasRepeatedRouteTendency") and flags.get("repeatedRouteName"):
            reflection_parts.append(
                f"You repeatedly returned to {flags['repeatedRouteName']}, showing route consistency."
            )
        if total_elevation_m is not None:
            reflection_parts.append(f"Elevation work totaled {float(total_elevation_m):.0f} m.")

        return NarrativeOutput(
            title=payload.recap_title,
            summary=summary,
            highlights=highlights,
            reflection=" ".join(reflection_parts),
            source=self.provider_name,
        )
