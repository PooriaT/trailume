from __future__ import annotations

from dataclasses import dataclass, field
import re


@dataclass(frozen=True)
class StravaPermissions:
    scopes: frozenset[str] = field(default_factory=frozenset)

    @classmethod
    def from_scope_string(cls, scope: str | None) -> "StravaPermissions":
        if not scope:
            return cls()

        scopes = frozenset(part for part in re.split(r"[\s,]+", scope.strip()) if part)
        return cls(scopes=scopes)

    @property
    def has_profile_read(self) -> bool:
        return "read" in self.scopes

    @property
    def has_activity_read(self) -> bool:
        return "activity:read" in self.scopes or self.has_private_activity_read

    @property
    def has_private_activity_read(self) -> bool:
        return "activity:read_all" in self.scopes

    @property
    def activity_access(self) -> str:
        if self.has_private_activity_read:
            return "private"
        if self.has_activity_read:
            return "standard"
        return "missing"
