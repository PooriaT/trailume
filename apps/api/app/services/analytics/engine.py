from app.models.domain import Activity, InsightBundle


class AnalyticsEngine:
    def build_insights(self, activities: list[Activity], activity_type: str) -> InsightBundle:
        if not activities:
            return InsightBundle(
                title="No activities in this range",
                narrative_seed="The selected period has no tracked activities.",
                key_metrics=[
                    {"label": "Activities", "value": "0"},
                    {"label": "Distance", "value": "0 km"},
                ],
                chart_points=[],
                standout_activities=[],
            )

        ordered_activities = sorted(activities, key=lambda item: item.start_time)
        total_distance_km = sum(a.distance_m for a in ordered_activities) / 1000
        total_elevation_m = int(sum(a.elevation_gain_m for a in ordered_activities))
        avg_distance_km = total_distance_km / len(ordered_activities)
        standout = max(ordered_activities, key=lambda x: x.distance_m)

        return InsightBundle(
            title=f"Your {activity_type.title()} Recap" if activity_type != "all" else "Your Activity Recap",
            narrative_seed=(
                f"You completed {len(activities)} activities totaling {total_distance_km:.1f} km "
                f"with {total_elevation_m} m climbing."
            ),
            key_metrics=[
                {"label": "Activities", "value": str(len(activities))},
                {"label": "Distance", "value": f"{total_distance_km:.1f} km"},
                {"label": "Avg distance", "value": f"{avg_distance_km:.1f} km"},
                {"label": "Elevation", "value": f"{total_elevation_m} m"},
            ],
            chart_points=[
                {"date": a.start_time.date().isoformat(), "distanceKm": round(a.distance_m / 1000, 1)}
                for a in ordered_activities
            ],
            standout_activities=[
                {
                    "id": standout.id,
                    "name": standout.name,
                    "reason": "Longest distance activity in the selected period.",
                    "distanceKm": round(standout.distance_m / 1000, 1),
                    "elevationM": int(standout.elevation_gain_m),
                }
            ],
        )
