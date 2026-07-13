"""
GovGuide AI — Eligibility Engine
Rule-based + AI-assisted scoring of programs against user profile.
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models.program import GovernmentProgram, ProgramStatus
from app.schemas import (
    EligibilityCheckRequest,
    EligibilityResponse,
    EligibleProgram,
    ProgramSummary,
)


class EligibilityService:
    """
    Checks which government programs a user qualifies for.

    Strategy:
    1. Pre-filter: SQL query narrows programs by hard criteria (age, region, status)
    2. Score: Soft matching gives each program a 0-100 match score
    3. Rank: Sort by score descending
    4. Enrich: Add match reasons and missing criteria
    """

    async def check(
        self,
        request: EligibilityCheckRequest,
        db: AsyncSession,
    ) -> EligibilityResponse:
        # ---- Step 1: Fetch active programs ----
        query = select(GovernmentProgram).where(
            GovernmentProgram.status == ProgramStatus.ACTIVE
        )

        # Hard filters (SQL level)
        # Region: program either has no region restriction or includes user's region
        query = query.where(
            or_(
                GovernmentProgram.regions.is_(None),
                GovernmentProgram.regions == [],
                GovernmentProgram.regions.contains([request.region]),
            )
        )

        # Age filter
        if request.age:
            query = query.where(
                and_(
                    or_(GovernmentProgram.age_min.is_(None), GovernmentProgram.age_min <= request.age),
                    or_(GovernmentProgram.age_max.is_(None), GovernmentProgram.age_max >= request.age),
                )
            )

        result = await db.execute(query)
        programs = result.scalars().all()

        # ---- Step 2: Score each program ----
        scored: list[tuple[GovernmentProgram, float, list[str], list[str]]] = []

        for program in programs:
            score, reasons, missing = self._score_program(program, request)
            if score > 0:
                scored.append((program, score, reasons, missing))

        # ---- Step 3: Sort by score ----
        scored.sort(key=lambda x: x[1], reverse=True)

        # ---- Step 4: Build response ----
        eligible_programs = []
        for program, score, reasons, missing in scored[:20]:  # Top 20
            lang = request.language or "ru"
            summary = ProgramSummary(
                id=program.id,
                slug=program.slug,
                title=program.get_title(lang),
                organization=program.organization,
                category=program.category.value,
                amount_min=program.amount_min,
                amount_max=program.amount_max,
                currency=program.currency,
                deadline=program.deadline,
                status=program.status.value,
                tags=program.tags,
                official_url=program.official_url,
                match_score=score,
            )
            next_steps = self._generate_next_steps(program, missing, lang)
            eligible_programs.append(EligibleProgram(
                program=summary,
                match_score=score,
                match_reasons=reasons,
                missing_criteria=missing,
                required_documents=program.required_documents or [],
                next_steps=next_steps,
            ))

        # Calculate profile completeness
        completeness = self._profile_completeness(request)

        return EligibilityResponse(
            success=True,
            total_eligible=len(eligible_programs),
            results=eligible_programs,
            profile_completeness=completeness,
        )

    def _score_program(
        self,
        program: GovernmentProgram,
        req: EligibilityCheckRequest,
    ) -> tuple[float, list[str], list[str]]:
        """
        Returns (score 0-100, match_reasons, missing_criteria).
        """
        score = 0.0
        reasons: list[str] = []
        missing: list[str] = []
        max_score = 0.0

        # ---- Age (20 pts) ----
        if program.age_min or program.age_max:
            max_score += 20
            age_min = program.age_min or 0
            age_max = program.age_max or 200
            if age_min <= req.age <= age_max:
                score += 20
                reasons.append(f"Age {req.age} is within {age_min}–{age_max} range")
            else:
                missing.append(f"Age requirement: {age_min}–{age_max} years")

        # ---- Student status (20 pts) ----
        if program.requires_student is not None:
            max_score += 20
            if program.requires_student == req.is_student:
                score += 20
                if req.is_student:
                    reasons.append("Student status confirmed")
            else:
                missing.append("Student status required")

        # ---- Region (15 pts) ----
        if program.regions:
            max_score += 15
            if not program.regions or req.region in program.regions:
                score += 15
                reasons.append(f"Region {req.region} is eligible")
            else:
                missing.append(f"Program limited to: {', '.join(program.regions)}")
        else:
            # Open to all regions
            max_score += 15
            score += 15
            reasons.append("Available in all regions of Kazakhstan")

        # ---- Income (15 pts) ----
        if program.income_max and req.monthly_income is not None:
            max_score += 15
            if req.monthly_income <= program.income_max:
                score += 15
                reasons.append("Income within program limits")
            else:
                missing.append(f"Income must be under {program.income_max:,.0f} ₸/month")

        # ---- Interest match (30 pts) ----
        max_score += 30
        if program.tags and req.interests:
            matches = set(t.lower() for t in (program.tags or [])) & set(i.lower() for i in (req.interests or []))
            interest_score = min(30, len(matches) * 10)
            score += interest_score
            if matches:
                reasons.append(f"Matches your interests: {', '.join(matches)}")

        # Normalize to 0-100
        if max_score > 0:
            normalized = (score / max_score) * 100
        else:
            normalized = 50.0  # Default for programs with no criteria

        return round(normalized, 1), reasons, missing

    def _profile_completeness(self, req: EligibilityCheckRequest) -> float:
        fields = [
            req.age,
            req.region,
            req.employment_status,
            req.monthly_income,
            req.interests,
        ]
        filled = sum(1 for f in fields if f is not None and f != [] and f != "")
        return round((filled / len(fields)) * 100, 1)

    def _generate_next_steps(self, program: GovernmentProgram, missing: list[str], lang: str) -> list[str]:
        steps = []
        
        # Translate helper
        if lang == "kz":
            if missing:
                steps.append("Сәйкестік критерийлерін толтыру немесе түзету")
            if program.required_documents:
                steps.append(f"Құжаттарды дайындау: {', '.join(program.required_documents[:3])}")
            steps.append("GovGuide-та өтінімнің жол картасын жасау")
            if program.official_url:
                steps.append(f"Ресми порталда өтінім беру: {program.official_url}")
        elif lang == "en":
            if missing:
                steps.append("Address missing eligibility requirements")
            if program.required_documents:
                steps.append(f"Prepare documents: {', '.join(program.required_documents[:3])}")
            steps.append("Create an application roadmap in GovGuide")
            if program.official_url:
                steps.append(f"Apply on the official portal: {program.official_url}")
        else: # default to ru
            if missing:
                steps.append("Устранить несоответствия требованиям")
            if program.required_documents:
                steps.append(f"Подготовить документы: {', '.join(program.required_documents[:3])}")
            steps.append("Создать дорожную карту подачи в GovGuide")
            if program.official_url:
                steps.append(f"Подать заявку на официальном сайте: {program.official_url}")
                
        return steps
