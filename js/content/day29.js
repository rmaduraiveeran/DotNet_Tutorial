/* Day 29: Prompt Engineering for .NET Devs */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[29] = {
  html: `
<p>Prompt engineering is API design for models: structured inputs, explicit outputs, guardrails, and tests. Today you treat prompts the way you treat code &mdash; versioned, evaluated, and improved.</p>

<h2>Anatomy of a production prompt</h2>
<div class="codeblock"><div class="codeblock-header">The five-part prompt template</div><pre><code>string BuildPrompt(string userMessage, string context) =&gt; $"""
    ## Role
    You are a support assistant for the TaskTracker API. You are precise and terse.

    ## Task
    Answer the user's question using ONLY the context below.
    If the context is insufficient, say exactly: "I don't have that information."

    ## Context (retrieved from documentation)
    {context}

    ## Rules
    - Cite sections as [doc:&lt;name&gt;] when you use one.
    - Never invent API endpoints. Code samples must compile for .NET 8.
    - Maximum 150 words.

    ## User question
    {userMessage}

    ## Response format
    Answer in this JSON: {{ "answer": string, "citations": string[], "confidence": number }}
    """;</code></pre></div>
<div class="table-wrap"><table>
<thead><tr><th>Part</th><th>Why it matters</th></tr></thead>
<tbody>
<tr><td><strong>Role</strong></td><td>sets voice and scope; reduces chatty off-topic answers</td></tr>
<tr><td><strong>Task</strong></td><td>one sentence of intent + an explicit failure mode (&ldquo;say you don't know&rdquo;)</td></tr>
<tr><td><strong>Context</strong></td><td>grounding data, clearly delimited &mdash; the anti-hallucination layer</td></tr>
<tr><td><strong>Rules</strong></td><td>constraints and citations; testable assertions about output</td></tr>
<tr><td><strong>Format</strong></td><td>machine-parseable output = your code stays typed and safe</td></tr>
</tbody></table></div>

<h2>Prompt patterns you will reuse</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 210" width="820" height="210" role="img" aria-label="Four core prompt patterns">
  <rect x="30" y="25" width="370" height="70" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.4"/>
  <text x="215" y="50" text-anchor="middle" class="dg-text">Few-shot</text>
  <text x="215" y="70" text-anchor="middle" class="dg-sub">2&ndash;3 worked examples inside the prompt;</text>
  <text x="215" y="86" text-anchor="middle" class="dg-sub">models mimic format &amp; style exactly</text>
  <rect x="430" y="25" width="360" height="70" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/>
  <text x="610" y="50" text-anchor="middle" class="dg-text">Chain-of-thought</text>
  <text x="610" y="70" text-anchor="middle" class="dg-sub">"think step by step" &mdash; better on</text>
  <text x="610" y="86" text-anchor="middle" class="dg-sub">multi-constraint problems</text>
  <rect x="30" y="115" width="370" height="70" rx="10" fill="#fef3e2" stroke="#d97706" stroke-width="1.4"/>
  <text x="215" y="140" text-anchor="middle" class="dg-text">Structured output</text>
  <text x="215" y="160" text-anchor="middle" class="dg-sub">demand JSON/schema &mdash; parse into C#</text>
  <text x="215" y="176" text-anchor="middle" class="dg-sub">records, validate like any DTO</text>
  <rect x="430" y="115" width="360" height="70" rx="10" fill="#fdecec" stroke="#dc2626" stroke-width="1.4"/>
  <text x="610" y="140" text-anchor="middle" class="dg-text">Guardrail / escape hatch</text>
  <text x="610" y="160" text-anchor="middle" class="dg-sub">an explicit "I don't know" path &mdash;</text>
  <text x="610" y="176" text-anchor="middle" class="dg-sub">silence beats invention</text>
</svg>
</div>

<h2>Parse model output like a DTO</h2>
<div class="codeblock"><div class="codeblock-header">StructuredResponse.cs</div><pre><code>public record AssistantReply(string Answer, string[] Citations, double Confidence);

var json = (await client.GetResponseAsync(prompt, new ChatOptions
{
    ResponseFormat = ChatResponseFormat.JsonObject     // forces valid JSON where supported
})).Text;

AssistantReply reply;
try
{
    reply = JsonSerializer.Deserialize&lt;AssistantReply&gt;(json,
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
        ?? throw new JsonException();
}
catch (JsonException)
{
    reply = new AssistantReply("Sorry, I could not produce a valid answer.", [], 0);
    logger.LogWarning("Model returned unparsable JSON: {Json}", json[..200]);
}

if (reply.Confidence &lt; 0.6)   // business rule on model output &mdash; like any input validation
    return Results.Json(new { reply.Answer, needsHuman = true });</code></pre></div>
<div class="callout note"><div class="co-title">Model output is untrusted input</div><p>Treat it exactly like user input: parse defensively, validate ranges, never hand raw text to <code>dotnet</code>, SQL, or a shell. And remember prompt injection &mdash; if retrieved documents or user text can contain instructions, delimit them and instruct the model to treat them as data, never as commands.</p></div>

<h2>Evaluate prompts like code</h2>
<ul>
  <li><strong>Golden set</strong>: 20&ndash;50 real questions + expected answers in a JSONL file.</li>
  <li><strong>Eval harness</strong>: run the prompt over the set after every edit &mdash; xUnit for prompts. Measure: accuracy, citation presence, JSON parse rate, latency, cost.</li>
  <li><strong>Version prompts</strong>: prompts in source control, one variable changed per iteration &mdash; otherwise you cannot attribute improvements.</li>
  <li><strong>Cache</strong>: identical (prompt, model, params) &rarr; cache responses; your wallet and your latency profile will thank you.</li>
</ul>
<div class="codeblock"><div class="codeblock-header">Prompts as testable configuration</div><pre><code>// Prompts live in appsettings / resources, not inline strings:
{
  "Prompts": {
    "Support": {
      "System": "You are a support assistant for {Product}...",
      "MaxWords": 150,
      "Temperature": 0.2,          // low = deterministic, factual tasks
      "Model": "gpt-4o-mini"
    }
  }
}</code></pre></div>
<div class="callout tip"><div class="co-title">Temperature, practically</div><p><code>0.0&ndash;0.3</code>: extraction, classification, code. <code>0.7&ndash;1.0</code>: brainstorming, naming, marketing copy. Your tracker assistant wants 0.2; the capstone's "name my project" feature wants 0.9.</p></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Take yesterday's chat feature and harden it: extract the prompt to configuration, enforce the five-part template, force JSON output parsed into a record, add a confidence threshold with human escalation, and build a 10-question golden set run through a test that fails when citation rate drops below 80%. Change one rule and watch the eval numbers move.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Structured prompts: role, task, context, rules, format.</li>
  <li>Ground answers in retrieved context; give an explicit "I don't know" path.</li>
  <li>Parse and validate model output like any untrusted DTO.</li>
  <li>Prompts are code: version them, eval them, configure them.</li>
</ul>
`
};
