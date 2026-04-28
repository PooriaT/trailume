from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, timedelta
from statistics import mean

from app.models.domain import Activity, InsightBundle, WeekAggregate


def _safe_speed_mps(activity: Activity) -> float | None:
    if not activity.moving_time_s or activity.moving_time_s <= 0:
        return None
    if activity.distance_m <= 0:
        return None
    return activity.distance_m / activity.moving_time_s


def _date_range(start_date: date, end_date: date) -> list[date]:
    days = (end_date - start_date).days + 1
    return [start_date + timedelta(days=index) for index in range(max(days, 0))]


def _week_start(value: date) -> date:
    return value - timedelta(days=value.weekday())


class AnalyticsEngine:
    def build_insights(
        self,
        activities: list[Activity],
        activity_type: str,
        *,
        start_date: date,
        end_date: date,
    ) -> InsightBundle:
        ordered_activities = sorted(activities, key=lambda item: item.start_time)
        if not ordered_activities:
            return self._empty_bundle(
                activity_type=activity_type, start_date=start_date, end_date=end_date
            )

        day_list = _date_range(start_date, end_date)
        date_counts = {day: 0 for day in day_list}
        date_distance = {day: 0.0 for day in day_list}
        date_elevation = {day: 0.0 for day in day_list}
        week_data: dict[date, dict[str, float | int | set[date]]] = defaultdict(
            lambda: {"count": 0, "distance": 0.0, "elevation": 0.0, "days": set()}
        )

        total_distance_m = 0.0
        timed_distance_m = 0.0
        total_moving_time_s = 0
        total_elapsed_time_s = 0
        total_elevation_m = 0.0
        moving_samples = 0
        elapsed_samples = 0
        elevation_samples = 0

        by_type: dict[str, dict[str, float | int | None]] = defaultdict(
            lambda: {
                "activityCount": 0,
                "distanceM": 0.0,
                "movingTimeS": 0,
                "elapsedTimeS": 0,
                "elevationGainM": 0.0,
            }
        )

        for activity in ordered_activities:
            activity_day = activity.start_time.date()
            week_start = _week_start(activity_day)

            date_counts.setdefault(activity_day, 0)
            date_distance.setdefault(activity_day, 0.0)
            date_elevation.setdefault(activity_day, 0.0)
            date_counts[activity_day] += 1
            date_distance[activity_day] += activity.distance_m
            date_elevation[activity_day] += max(activity.elevation_gain_m, 0.0)

            week_data[week_start]["count"] = int(week_data[week_start]["count"]) + 1
            week_data[week_start]["distance"] = (
                float(week_data[week_start]["distance"]) + activity.distance_m
            )
            week_data[week_start]["elevation"] = float(week_data[week_start]["elevation"]) + max(
                activity.elevation_gain_m, 0.0
            )
            cast_days = week_data[week_start]["days"]
            if isinstance(cast_days, set):
                cast_days.add(activity_day)

            total_distance_m += activity.distance_m
            total_elevation_m += max(activity.elevation_gain_m, 0.0)
            elevation_samples += 1

            if activity.moving_time_s and activity.moving_time_s > 0:
                timed_distance_m += activity.distance_m
                total_moving_time_s += activity.moving_time_s
                moving_samples += 1

            if activity.elapsed_time_s and activity.elapsed_time_s > 0:
                total_elapsed_time_s += activity.elapsed_time_s
                elapsed_samples += 1

            per_type = by_type[activity.activity_type]
            per_type["activityCount"] = int(per_type["activityCount"]) + 1
            per_type["distanceM"] = float(per_type["distanceM"]) + activity.distance_m
            if activity.moving_time_s and activity.moving_time_s > 0:
                per_type["movingTimeS"] = int(per_type["movingTimeS"]) + activity.moving_time_s
            if activity.elapsed_time_s and activity.elapsed_time_s > 0:
                per_type["elapsedTimeS"] = int(per_type["elapsedTimeS"]) + activity.elapsed_time_s
            per_type["elevationGainM"] = float(per_type["elevationGainM"]) + max(
                activity.elevation_gain_m, 0.0
            )

        total_count = len(ordered_activities)
        avg_distance_m = total_distance_m / total_count
        avg_moving_time_s = (total_moving_time_s / moving_samples) if moving_samples else None
        avg_speed_mps = (
            (timed_distance_m / total_moving_time_s) if total_moving_time_s > 0 else None
        )

        longest = max(ordered_activities, key=lambda item: item.distance_m)
        highest_elevation = max(ordered_activities, key=lambda item: item.elevation_gain_m)

        speed_candidates = [
            (activity, _safe_speed_mps(activity))
            for activity in ordered_activities
            if activity.distance_m >= 1000
        ]
        speed_candidates = [
            (activity, speed) for activity, speed in speed_candidates if speed is not None
        ]
        fastest = max(speed_candidates, key=lambda pair: pair[1])[0] if speed_candidates else None

        most_active_day_date, most_active_day_count = max(
            date_counts.items(),
            key=lambda pair: (pair[1], date_distance.get(pair[0], 0.0), pair[0]),
        )

        week_aggregates = self._build_week_aggregates(week_data)
        highest_volume_week = (
            max(
                week_aggregates,
                key=lambda week: (week.distance_m, week.activity_count, week.week_start),
            )
            if week_aggregates
            else None
        )
        most_consistent_week = (
            max(
                week_aggregates,
                key=lambda week: (week.active_days, week.activity_count, week.week_start),
            )
            if week_aggregates
            else None
        )

        frequency_trend = self._compute_frequency_trend(ordered_activities)
        finish_flag = self._compute_finish_flag(ordered_activities)
        repeated_route = self._repeated_route_tendency(ordered_activities)

        standout = [
            {
                "id": longest.id,
                "name": longest.name,
                "reason": "Longest activity in the selected range.",
                "distanceKm": round(longest.distance_m / 1000, 1),
                "elevationM": int(max(longest.elevation_gain_m, 0)),
                "movingTimeS": longest.moving_time_s,
            },
            {
                "id": highest_elevation.id,
                "name": highest_elevation.name,
                "reason": "Highest elevation gain in the selected range.",
                "distanceKm": round(highest_elevation.distance_m / 1000, 1),
                "elevationM": int(max(highest_elevation.elevation_gain_m, 0)),
                "movingTimeS": highest_elevation.moving_time_s,
            },
        ]
        if fastest:
            standout.append(
                {
                    "id": fastest.id,
                    "name": fastest.name,
                    "reason": "Fastest effort by average moving speed (distance / moving time).",
                    "distanceKm": round(fastest.distance_m / 1000, 1),
                    "elevationM": int(max(fastest.elevation_gain_m, 0)),
                    "movingTimeS": fastest.moving_time_s,
                }
            )

        biggest_climbing_day = max(date_elevation.items(), key=lambda pair: (pair[1], pair[0]))

        key_metrics = [
            {"label": "Activities", "value": str(total_count)},
            {"label": "Distance", "value": f"{total_distance_m / 1000:.1f} km"},
            {
                "label": "Moving time",
                "value": self._format_duration(total_moving_time_s)
                if total_moving_time_s
                else "N/A",
            },
            {"label": "Avg distance", "value": f"{avg_distance_m / 1000:.1f} km"},
        ]

        highlight_cards = [
            {
                "id": "longest-activity",
                "title": "Longest activity",
                "value": f"{longest.distance_m / 1000:.1f} km",
                "detail": longest.name,
            },
            {
                "id": "biggest-climbing-day",
                "title": "Biggest climbing day",
                "value": f"{biggest_climbing_day[1]:.0f} m",
                "detail": biggest_climbing_day[0].isoformat(),
            },
        ]
        if fastest:
            highlight_cards.append(
                {
                    "id": "fastest-effort",
                    "title": "Fastest effort",
                    "value": f"{(_safe_speed_mps(fastest) or 0) * 3.6:.1f} km/h",
                    "detail": fastest.name,
                }
            )
        if most_consistent_week:
            highlight_cards.append(
                {
                    "id": "most-consistent-week",
                    "title": "Most consistent week",
                    "value": f"{most_consistent_week.active_days} active days",
                    "detail": most_consistent_week.week_start.isoformat(),
                }
            )
        if highest_volume_week:
            highlight_cards.append(
                {
                    "id": "highest-volume-week",
                    "title": "Highest-volume week",
                    "value": f"{highest_volume_week.distance_m / 1000:.1f} km",
                    "detail": highest_volume_week.week_start.isoformat(),
                }
            )

        summary_metrics: dict[
            str, float | int | None | dict[str, dict[str, float | int | None]]
        ] = {
            "activityCount": total_count,
            "totalDistanceM": round(total_distance_m, 2),
            "totalMovingTimeS": total_moving_time_s if moving_samples else None,
            "totalElapsedTimeS": total_elapsed_time_s if elapsed_samples else None,
            "totalElevationGainM": round(total_elevation_m, 2) if elevation_samples else None,
            "averageDistanceM": round(avg_distance_m, 2),
            "averageMovingTimeS": round(avg_moving_time_s, 2)
            if avg_moving_time_s is not None
            else None,
            "averageSpeedMps": round(avg_speed_mps, 4) if avg_speed_mps is not None else None,
            "totalsByActivityType": by_type,
        }

        trend_series = [
            {
                "bucketStart": day.isoformat(),
                "bucketType": "day",
                "activityCount": int(date_counts.get(day, 0)),
                "distanceKm": round(date_distance.get(day, 0.0) / 1000, 2),
            }
            for day in day_list
        ] + [
            {
                "bucketStart": week.week_start.isoformat(),
                "bucketType": "week",
                "activityCount": week.activity_count,
                "distanceKm": round(week.distance_m / 1000, 2),
            }
            for week in week_aggregates
        ]

        chart_points = [
            {
                "date": day.isoformat(),
                "distanceKm": round(date_distance.get(day, 0.0) / 1000, 2),
                "activityCount": int(date_counts.get(day, 0)),
            }
            for day in day_list
        ]

        insight_flags: dict[str, bool | str | int | float | None] = {
            "hasFastestEffort": fastest is not None,
            "hasStrongFinish": finish_flag == "strong_finish",
            "hasSlowStart": finish_flag == "slow_start",
            "frequencyTrend": frequency_trend,
            "hasRepeatedRouteTendency": repeated_route is not None,
            "repeatedRouteName": repeated_route,
        }

        metadata: dict[str, str | int | bool | None | list[str] | dict[str, float | int | None]] = {
            "selectedActivityType": activity_type,
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "rangeDays": len(day_list),
            "hasElapsedTimeCoverage": elapsed_samples > 0,
            "hasMovingTimeCoverage": moving_samples > 0,
            "availableActivityTypes": sorted(by_type.keys()),
            "mostActiveDay": {
                "date": most_active_day_date.isoformat(),
                "activityCount": most_active_day_count,
                "distanceM": round(date_distance.get(most_active_day_date, 0.0), 2),
            },
        }

        return InsightBundle(
            title=f"Your {activity_type.title()} Recap"
            if activity_type != "all"
            else "Your Activity Recap",
            summary_metrics=summary_metrics,
            key_metrics=key_metrics,
            highlight_cards=highlight_cards,
            chart_points=chart_points,
            trend_series=trend_series,
            standout_activities=standout,
            map_data=self._build_map_data(ordered_activities),
            insight_flags=insight_flags,
            metadata=metadata,
        )

    def _empty_bundle(
        self, *, activity_type: str, start_date: date, end_date: date
    ) -> InsightBundle:
        day_list = _date_range(start_date, end_date)
        return InsightBundle(
            title="No activities in this range",
            summary_metrics={
                "activityCount": 0,
                "totalDistanceM": 0.0,
                "totalMovingTimeS": None,
                "totalElapsedTimeS": None,
                "totalElevationGainM": None,
                "averageDistanceM": 0.0,
                "averageMovingTimeS": None,
                "averageSpeedMps": None,
                "totalsByActivityType": {},
            },
            key_metrics=[
                {"label": "Activities", "value": "0"},
                {"label": "Distance", "value": "0.0 km"},
                {"label": "Moving time", "value": "N/A"},
                {"label": "Avg distance", "value": "0.0 km"},
            ],
            highlight_cards=[],
            chart_points=[
                {"date": day.isoformat(), "distanceKm": 0.0, "activityCount": 0} for day in day_list
            ],
            trend_series=[
                {
                    "bucketStart": day.isoformat(),
                    "bucketType": "day",
                    "activityCount": 0,
                    "distanceKm": 0.0,
                }
                for day in day_list
            ],
            standout_activities=[],
            map_data=None,
            insight_flags={
                "hasFastestEffort": False,
                "hasStrongFinish": False,
                "hasSlowStart": False,
                "frequencyTrend": "flat",
                "hasRepeatedRouteTendency": False,
                "repeatedRouteName": None,
            },
            metadata={
                "selectedActivityType": activity_type,
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "rangeDays": len(day_list),
                "hasElapsedTimeCoverage": False,
                "hasMovingTimeCoverage": False,
                "availableActivityTypes": [],
                "mostActiveDay": None,
            },
        )

    def _compute_frequency_trend(self, ordered_activities: list[Activity]) -> str:
        if len(ordered_activities) < 4:
            return "flat"

        midpoint = len(ordered_activities) // 2
        first_half_days = [item.start_time.date() for item in ordered_activities[:midpoint]]
        second_half_days = [item.start_time.date() for item in ordered_activities[midpoint:]]

        first_density = len(first_half_days) / max(
            (max(first_half_days) - min(first_half_days)).days + 1, 1
        )
        second_density = len(second_half_days) / max(
            (max(second_half_days) - min(second_half_days)).days + 1, 1
        )

        if second_density - first_density > 0.08:
            return "increasing"
        if first_density - second_density > 0.08:
            return "decreasing"
        return "flat"

    def _compute_finish_flag(self, ordered_activities: list[Activity]) -> str:
        if len(ordered_activities) < 6:
            return "insufficient_data"

        chunk_size = max(len(ordered_activities) // 3, 1)
        start_chunk = ordered_activities[:chunk_size]
        end_chunk = ordered_activities[-chunk_size:]

        start_avg = mean(item.distance_m for item in start_chunk)
        end_avg = mean(item.distance_m for item in end_chunk)

        if end_avg > start_avg * 1.15:
            return "strong_finish"
        if start_avg > end_avg * 1.15:
            return "slow_start"
        return "balanced"

    def _repeated_route_tendency(self, activities: list[Activity]) -> str | None:
        normalized_names = [self._normalize_name(item.name) for item in activities]
        counts = Counter(name for name in normalized_names if name)
        if not counts:
            return None
        route, repeat_count = counts.most_common(1)[0]
        if repeat_count >= 3:
            return route
        return None

    def _build_map_data(self, activities: list[Activity]) -> dict[str, object] | None:
        map_activities = []
        for activity in activities:
            has_coordinates = activity.start_latlng is not None or activity.end_latlng is not None
            has_polyline = bool(activity.summary_polyline)
            if not has_coordinates and not has_polyline:
                continue

            map_activities.append(
                {
                    "id": activity.id,
                    "name": activity.name,
                    "startDate": activity.start_time.date().isoformat(),
                    "activityType": activity.activity_type,
                    "distanceM": round(activity.distance_m, 2),
                    "elevationGainM": round(activity.elevation_gain_m, 2),
                    "startCoordinate": self._coordinate_dict(activity.start_latlng),
                    "endCoordinate": self._coordinate_dict(activity.end_latlng),
                    "summaryPolyline": activity.summary_polyline,
                }
            )

        if not map_activities:
            return None

        return {"activities": map_activities, "isDemoData": False}

    def _coordinate_dict(self, value: tuple[float, float] | None) -> dict[str, float] | None:
        if value is None:
            return None
        return {"lat": value[0], "lng": value[1]}

    def _normalize_name(self, name: str) -> str:
        lowered = "".join(ch.lower() if ch.isalpha() or ch.isspace() else " " for ch in name)
        compact = " ".join(lowered.split())
        return compact

    def _build_week_aggregates(
        self, week_data: dict[date, dict[str, float | int | set[date]]]
    ) -> list[WeekAggregate]:
        aggregates: list[WeekAggregate] = []
        for week_start, metrics in sorted(week_data.items(), key=lambda item: item[0]):
            days_set = metrics["days"]
            aggregates.append(
                WeekAggregate(
                    week_start=week_start,
                    activity_count=int(metrics["count"]),
                    active_days=len(days_set) if isinstance(days_set, set) else 0,
                    distance_m=float(metrics["distance"]),
                    elevation_gain_m=float(metrics["elevation"]),
                )
            )
        return aggregates

    def _format_duration(self, seconds: int) -> str:
        hours, remainder = divmod(seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return f"{hours}h {minutes}m"
