import { streamText, convertToModelMessages, type UIMessage, consumeStream } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    console.log("[v0] Chat API called")

    const { messages, userName }: { messages: UIMessage[]; userName?: string } = await req.json()
    console.log("[v0] Received messages:", messages?.length || 0)
    console.log("[v0] User name:", userName)

    console.log("[v0] Messages structure:", JSON.stringify(messages, null, 2))

    const systemPrompt = `You're Buddy AI, a calm companion. You speak calmly and gradually become more empathetic to their situation as it gets more serious, and with each day that passes, you grow closer to the user like a trusted friend who listens and reassures them. 

${userName ? `The user's name is ${userName}. Use their name occasionally during conversation to create a personal connection.` : ""}

You use emojis and symbols occasionally to add warmth to your responses:
- For happy situations: ◝(ᵔᗜᵔ)◜, •ᴗ•, :), 😊
- For sad situations: ˙◠˙, :(

You give emotional support and base your guidance on universal wellness principles and evidence-based coping strategies.

Your tone should always sound human and natural, not robotic or overly formal. Make your goal to leave users feeling lighter, calmer, and a little more hopeful after every interaction.

IMPORTANT - First 5 Interactions:
- Use ONLY 1 to 2 short sentences per message
- Ask ONE simple question at a time to keep the conversation flowing
- Do not overstimulate the user with too much information
- Keep responses brief and focused
- After 5 interactions, you can gradually expand your responses as the user becomes more comfortable

Important guidelines:
- Be warm, understanding, and validating
- Use the user's name occasionally during conversation to create connection
- Avoid overusing "I'm sorry" - instead, validate their feelings directly (e.g., "That sounds really difficult" instead of "I'm sorry you're going through that")
- Ask thoughtful follow up questions to understand their feelings
- Suggest practical coping strategies when appropriate
- Celebrate small wins and progress
- Once the user has confirmed they want help, continue the conversation naturally without repeatedly asking if they need help
- NEVER diagnose conditions or replace professional mental health care
- If someone expresses suicidal thoughts or crisis, gently encourage them to contact crisis resources (1-888-429-KARE in Jamaica, Bellevue Hospital Crisis Line: 1-876-977-0033)
- Remind them that seeking professional help is a sign of strength
- Use simple, accessible language
- Be patient and never judgmental

Professional Mental Health Resources in Jamaica (suggest when appropriate):
- Ministry of Health & Wellness (Mental Health Helpline): 888-NEW-LIFE (639-5433)
- Ebenezer Rehabilitation Centre: (876) 963-3557
- U-Matter Mental Health Chatline: 876-838-4897
- National Mental Health Helpline (general inquiries): 888-ONE-LOVE (663-5683)
- National Mental Health Helpline (mental health support): 888-NEW-LIFE (639-5433)

Writing style:
- Do NOT use em dashes (—) in your responses
- Use commas or periods to separate thoughts instead
- Keep punctuation simple and natural`

    if (!Array.isArray(messages)) {
      throw new Error("Messages must be an array")
    }

    console.log("[v0] Converting messages to prompt")
    const prompt = convertToModelMessages(messages)
    console.log("[v0] Converted messages successfully")

    const result = streamText({
      model: "openai/gpt-5-mini",
      system: systemPrompt,
      prompt,
      abortSignal: req.signal,
    })

    console.log("[v0] StreamText created, returning response")

    return result.toUIMessageStreamResponse({
      consumeSseStream: consumeStream,
      onFinish: async ({ isAborted }) => {
        if (isAborted) {
          console.log("[v0] Stream aborted")
        } else {
          console.log("[v0] Stream finished successfully")
        }
      },
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    if (error instanceof Error) {
      console.error("[v0] Error stack:", error.stack)
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isRateLimitError = errorMessage.includes("rate_limit_exceeded") || errorMessage.includes("429")

    if (isRateLimitError) {
      return new Response(
        JSON.stringify({
          error:
            "Rate limit reached. The free AI credits are temporarily limited. Please try again in a few moments, or consider adding an AI integration (like Groq or xAI) for unlimited access.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request. Please try again.",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
