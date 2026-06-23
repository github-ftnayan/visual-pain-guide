import re
import os
from typing import Any, Tuple
from dotenv import load_dotenv
from pydantic import ValidationError

load_dotenv()

from schemas import TriageAnalysis

CRITICAL_RED_FLAGS = re.compile(
    r"\b(pop|crack|snap|numb|numbness|tingling|paralysis|paralyzed|"
    r"fall|fell|accident|trauma|blood|bleeding|shooting\s+pain|"
    r"radiating|weakness|cannot\s+move|can't\s+move|no\s+feeling|"
    r"electric|stabbing|fracture|break|broken|dislocate)\b",
    re.IGNORECASE,
)

_BASE_SYSTEM_PROMPT = """You are a conservative physical therapy safety screener. Analyze the patient's self-reported musculoskeletal symptom description and determine whether it is safe to recommend home PT exercises.

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

For SAFE responses: populate remediation_tags with 4-8 values from the enum in the tool schema.
For RED_FLAG responses: set remediation_tags to an empty array."""


def _build_system_prompt(rag_context: str) -> str:
    if not rag_context:
        return _BASE_SYSTEM_PROMPT
    return (
        _BASE_SYSTEM_PROMPT
        + "\n\n## Reference Knowledge (from PT clinical guide)\n"
        + rag_context
        + "\n\nUse the above reference material to inform your analysis. "
        + "Prioritize it over general knowledge when assessing mechanism and remediation."
    )


_client: Any = None
_model: str = ""
_provider: str = ""


def _build_client() -> Tuple[Any, str, str]:
    provider = os.getenv("LLM_PROVIDER", "").lower()

    if not provider:
        if os.getenv("ANTHROPIC_API_KEY"):
            provider = "anthropic"
        elif os.getenv("DEEPSEEK_API_KEY"):
            provider = "deepseek"
        else:
            raise RuntimeError(
                "No LLM API key found. Set ANTHROPIC_API_KEY or DEEPSEEK_API_KEY in backend/.env"
            )

    if provider == "anthropic":
        import anthropic
        return anthropic.Anthropic(), "claude-sonnet-4-6", "anthropic"

    if provider == "deepseek":
        from openai import OpenAI
        return (
            OpenAI(api_key=os.environ["DEEPSEEK_API_KEY"], base_url="https://api.deepseek.com"),
            "deepseek-chat",
            "deepseek",
        )

    raise RuntimeError(f"Unknown LLM_PROVIDER: {provider!r}. Valid values: 'anthropic', 'deepseek'.")


def _get_client() -> Tuple[Any, str, str]:
    global _client, _model, _provider
    if _client is None:
        _client, _model, _provider = _build_client()
    return _client, _model, _provider


def _safe_fallback() -> TriageAnalysis:
    return TriageAnalysis(
        safety_status="RED_FLAG",
        perceived_mechanism="Unable to parse LLM response.",
        linguistic_justification="Schema validation failed.",
        remediation_tags=[],
        empathetic_response=(
            "We encountered an issue analyzing your symptoms. "
            "Please try rephrasing your description, or consult a healthcare professional."
        ),
    )


def _anthropic_triage(
    client: Any, model: str, muscle_id: str, symptom_text: str, rag_context: str
) -> TriageAnalysis:
    payload = f"Muscle group: {muscle_id}\nSymptom description: {symptom_text}"
    system_prompt = _build_system_prompt(rag_context)
    response = client.messages.create(
        model=model,
        max_tokens=1024,
        system=system_prompt,
        tools=[{
            "name": "record_triage",
            "description": "Record the structured triage analysis result.",
            "input_schema": TriageAnalysis.model_json_schema(),
        }],
        tool_choice={"type": "tool", "name": "record_triage"},
        messages=[{"role": "user", "content": payload}],
    )
    try:
        tool_use = next(b for b in response.content if b.type == "tool_use")
        return TriageAnalysis.model_validate(tool_use.input)
    except (StopIteration, ValidationError):
        return _safe_fallback()


def _openai_triage(
    client: Any, model: str, muscle_id: str, symptom_text: str, rag_context: str
) -> TriageAnalysis:
    payload = f"Muscle group: {muscle_id}\nSymptom description: {symptom_text}"
    system_prompt = _build_system_prompt(rag_context)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": payload},
        ],
        tools=[{
            "type": "function",
            "function": {
                "name": "record_triage",
                "description": "Record the structured triage analysis result.",
                "parameters": TriageAnalysis.model_json_schema(),
            },
        }],
        tool_choice={"type": "function", "function": {"name": "record_triage"}},
    )
    try:
        args = response.choices[0].message.tool_calls[0].function.arguments
        return TriageAnalysis.model_validate_json(args)
    except (IndexError, AttributeError, ValidationError):
        return _safe_fallback()


def tier1_regex_check(text: str) -> bool:
    return bool(CRITICAL_RED_FLAGS.search(text))


def tier2_llm_analysis(muscle_id: str, symptom_text: str, rag_context: str = "") -> TriageAnalysis:
    client, model, provider = _get_client()
    if provider == "anthropic":
        return _anthropic_triage(client, model, muscle_id, symptom_text, rag_context)
    return _openai_triage(client, model, muscle_id, symptom_text, rag_context)


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

    # Retrieve relevant PT knowledge before calling the LLM (gracefully skipped if not yet seeded)
    from retriever import retrieve_context
    rag_context = retrieve_context(muscle_id, symptom_text)

    return tier2_llm_analysis(muscle_id, symptom_text, rag_context)
