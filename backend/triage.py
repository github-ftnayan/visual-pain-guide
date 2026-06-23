import re
from dotenv import load_dotenv

load_dotenv()

import instructor
import anthropic
from schemas import TriageAnalysis

CRITICAL_RED_FLAGS = re.compile(
    r"\b(pop|crack|snap|numb|numbness|tingling|paralysis|paralyzed|"
    r"fall|fell|accident|trauma|blood|bleeding|shooting\s+pain|"
    r"radiating|weakness|cannot\s+move|can't\s+move|no\s+feeling|"
    r"electric|stabbing|fracture|break|broken|dislocate)\b",
    re.IGNORECASE,
)

SYSTEM_PROMPT = """You are a conservative physical therapy safety screener. Analyze the patient's self-reported musculoskeletal symptom description and determine whether it is safe to recommend home PT exercises.

## Classification Rules

Classify as RED_FLAG if the description contains ANY of:
- Neurological symptoms: numbness, tingling, weakness, paralysis, loss of coordination
- Acute traumatic injury: fall, collision, accident, pop/snap/crack at time of injury
- Systemic symptoms: fever with pain, unexplained weight loss
- Vascular signs: swelling with redness and heat
- Loss of bladder or bowel control
- Pain that is constant, worsening, and unrelated to movement
- Radiating pain following a dermatome pattern

Classify as SAFE only when the description suggests:
- Muscle tightness, soreness, or stiffness
- Pain that varies with position or movement
- Overuse, poor posture, or muscular deconditioning
- Gradual onset without acute injury
- Pain relieved by rest or gentle movement

## Allowed remediation_tags vocabulary (use ONLY these exact strings):
stretching, strengthening, mobility, core_stability, foam_rolling, posture, eccentric_loading,
activation, stabilization, mckenzie, pnf, release, traction, decompression, daily_routine,
flexibility, rehabilitation, prevention, sports, running, desk_worker, range_of_motion,
hip_flexor, posterior_chain, lateral_stability, scapula, rotator_cuff, impingement

For SAFE responses: return 4-8 tags from the vocabulary above that best match the symptoms.
For RED_FLAG responses: return an empty list for remediation_tags.

Respond ONLY with the JSON object matching the required schema. No preamble."""

_client: instructor.Instructor | None = None


def _get_client() -> instructor.Instructor:
    global _client
    if _client is None:
        _client = instructor.from_anthropic(anthropic.Anthropic())
    return _client


def tier1_regex_check(text: str) -> bool:
    return bool(CRITICAL_RED_FLAGS.search(text))


def tier2_llm_analysis(muscle_id: str, symptom_text: str) -> TriageAnalysis:
    payload = f"Muscle group: {muscle_id}\nSymptom description: {symptom_text}"
    return _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": SYSTEM_PROMPT + "\n\n" + payload}],
        response_model=TriageAnalysis,
    )


def run_triage(muscle_id: str, symptom_text: str) -> TriageAnalysis:
    if tier1_regex_check(symptom_text):
        return TriageAnalysis(
            safety_status="RED_FLAG",
            perceived_mechanism="Potential acute injury or serious neurological symptom detected by keyword screening.",
            linguistic_justification="Critical keywords matched in Tier 1 regex screen — no LLM call made.",
            remediation_tags=[],
            empathetic_response=(
                "We noticed your description may indicate a serious condition. "
                "Please stop any activity immediately and consult a licensed physician or "
                "visit an emergency room if you are experiencing severe symptoms. "
                "Your safety comes first — please seek professional care before attempting any self-treatment."
            ),
        )
    return tier2_llm_analysis(muscle_id, symptom_text)
