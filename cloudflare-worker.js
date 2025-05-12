export default {
  async fetch(request) {
    const OPENAI_API_KEY = "your-openai-api-key"; // Replace with your OpenAI API key

    // Parse the incoming request
    const requestBody = await request.json();

    // Forward the request to the OpenAI API with web search enabled if requested
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: requestBody.model,
          messages: requestBody.messages,
          ...(requestBody.enable_web_search && { enable_web_search: true }), // Include web search parameter if enabled
        }),
      }
    );

    // Return the OpenAI API response
    return new Response(await openaiResponse.text(), {
      status: openaiResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  },
};
