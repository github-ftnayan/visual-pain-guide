import re
import os

import anthropic
import instructor

from schemas import TriageAnalysis

CRITICAL_RED_FLAGS = re.compile(
    r"\b(pop|crack|snap|numb|numbness|tingling|paralysis|paralyzed|"
    r"fall|fell|accident|trauma|blood|bleeding|shooting\s+pain|"
    r"radiating\s+pain|weakness|cannot\s+move|can't\s+move|"
    r"loss\s+of\s+sensation|electric\s+shock|cauda\s+equina)\b",
    re.IGNORECASE,
)

_RED_FLAG_RESPONSE = TriageAnalysis(
    safety_status="RED_FLAG",
    perceived_mechanism="Potential acute injury or serious neurological symptom detected by keyword screening.",
    linguistic_justification="Critical safety keywords matched in Tier 1 regex screen. LLM analysis bypassed.",
    remediation_tags=[],
    empathetic_response=(
        "We noticed your description contains symptoms that may indicate a serious condition. "
        "Please stop any activity immediately and consult a licensed physician or physiotherapist "
        "for a thorough assessment before attempting any home exercises. "
        "If you are experiencing severe symptoms, please visit an emergency room."
    ),
)

SYSTEM_PROMPT_BASE = """You are a conservative physical therapy safety screener. Your job is to analyse a patient's self-reported musculoskeletal symptom description and determine whether it is safe to recommend home PT exercises, or whether it requires immediate medical attention.

## Safety Classification Rules

Classify as RED_FLAG if the description contains ANY of the following:
- Neurological symptoms: numbness, tingling, weakness, paralysis, loss of sensation
- Acute traumatic injury: fall, collision, accident, pop/snap/crack sound at time of injury
- Systemic symptoms: fever with pain, unexplained weight loss, night sweats
- Vascular symptoms: swelling with redness and heat, pulsating pain
- Loss of bladder or bowel control
- Pain that is constant, worsening, and entirely unrelated to movement
- Clearly radiating pain following a dermatomal distribution (down the arm or leg)

Classify as SAFE only when the description suggests:
- Muscle tightness, soreness, or stiffness
- Pain that varies with position or movement
- Symptoms consistent with overuse, poor posture, or muscular deconditioning
- Gradual onset pain without acute injury event
- Pain that improves with rest or gentle movement

## Remediation Tag Vocabulary
When classifying as SAFE, generate remediation_tags from this exact vocabulary:
stretching, strengthening, mobility, core_stability, foam_rolling, posture, eccentric_loading,
activation, stabilization, mckenzie, pnf, release, traction, decompression, daily_routine,
flexibility, rehabilitation, prevention, sports, running, desk_worker, range_of_motion,
hip_flexor, posterior_chain, lateral_stability, scapula, rotator_cuff, lower_back

## Response Requirements
- safety_status: exactly "SAFE" or "RED_FLAG"
- perceived_mechanism: clinical explanation of the likely pain mechanism (1-2 sentences)
- linguistic_justification: quote the specific words/phrases that drove your classification
- remediation_tags: 4-8 tags from the vocabulary above (empty list if RED_FLAG)
- empathetic_response: warm, professional message; for SAFE acknowledge the pain and briefly explain what will help; for RED_FLAG express care and urge consultation without being alarmist

Respond ONLY with the JSON object matching the schema. No preamble."""

RAG_CONTEXT_TEMPLATE = """
## Reference Knowledge (from PT Clinical Guide)
The following passages are retrieved from an evidence-based physiotherapy reference. Use them to inform your assessment of mechanism and appropriate remediation.

{rag_context}

Prioritise this reference material over general knowledge when available.
"""

_instructor_client: instructor.Instructor | None = None


def _get_client() -> instructor.Instructor:
    global _instructor_client
    if _instructor_client is None:
        _instructor_client = instructor.from_anthropic(anthropic.Anthropic())
    return _instructor_client


def tier1_regex_check(text: str) -> bool:
    return bool(CRITICAL_RED_FLAGS.search(text))


def tier2_llm_analysis(muscle_id: str, symptom_text: str, rag_context: str = "") -> TriageAnalysis:
    system_prompt = SYSTEM_PROMPT_BASE
    if rag_context:
        system_prompt += RAG_CONTEXT_TEMPLATE.format(rag_context=rag_context)

    user_payload = f"Muscle group: {muscle_id.replace('_', ' ')}\nPatient description: {symptom_text}"

    return _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": system_prompt + "\n\n" + user_payload}],
        response_model=TriageAnalysis,
    )


def run_triage(muscle_id: str, symptom_text: str) -> TriageAnalysis:
    # Tier 1: local regex gate — zero cost, zero latency
    if tier1_regex_check(symptom_text):
        return _RED_FLAG_RESPONSE

    # RAG retrieval: import here to avoid circular imports and allow lazy loading
    try:
        from retriever import retrieve_context
        rag_context = retrieve_context(muscle_id, symptom_text)
    except Exception:
        rag_context = ""

    # Tier 2: LLM with optional RAG context
    return tier2_llm_analysis(muscle_id, symptom_text, rag_context)
