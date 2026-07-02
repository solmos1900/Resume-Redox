export function getOpenAiKey(): string | null {
  return process.env.OPENAI_API_KEY ?? null;
}

export async function callOpenAI(
  prompt: string,
  temperature = 0.4
): Promise<string> {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");
  return content;
}

export function aiUnavailableResponse() {
  return Response.json(
    {
      error:
        "AI features require OPENAI_API_KEY in .env.local. See .env.example.",
    },
    { status: 503 }
  );
}
