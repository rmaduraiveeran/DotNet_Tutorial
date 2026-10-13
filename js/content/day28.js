/* Day 28: AI Integration with .NET */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[28] = {
  html: `
<p>AI is becoming part of ordinary .NET apps: semantic search, chat assistants, classification, agents. Today: the landscape, the two main libraries (Semantic Kernel and Microsoft.Extensions.AI), and a working chat-with-your-data pipeline.</p>

<h2>The building blocks</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 200" width="820" height="200" role="img" aria-label="AI integration stack">
  <defs><marker id="d28a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="40" y="30" width="220" height="60" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.4"/><text x="150" y="55" text-anchor="middle" class="dg-text">Your .NET app</text><text x="150" y="73" text-anchor="middle" class="dg-sub">DI &middot; resilience &middot; telemetry</text>
  <rect x="330" y="30" width="200" height="60" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="430" y="50" text-anchor="middle" class="dg-text">Abstraction layer</text><text x="430" y="68" text-anchor="middle" class="dg-sub">IChatClient &middot; IEmbedder</text>
  <rect x="600" y="20" width="190" height="34" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="695" y="43" text-anchor="middle" class="dg-sub">OpenAI / Azure OpenAI</text>
  <rect x="600" y="62" width="190" height="34" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="695" y="85" text-anchor="middle" class="dg-sub">Ollama / local models</text>
  <rect x="330" y="130" width="200" height="50" rx="10" fill="#ece8fe" stroke="#7c3aed" stroke-width="1.4"/><text x="430" y="150" text-anchor="middle" class="dg-text">Vector store</text><text x="430" y="168" text-anchor="middle" class="dg-sub">Qdrant &middot; pgvector &middot; in-memory</text>
  <rect x="40" y="130" width="220" height="50" rx="10" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.4"/><text x="150" y="150" text-anchor="middle" class="dg-text">Your data</text><text x="150" y="168" text-anchor="middle" class="dg-sub">docs &middot; tickets &middot; SQL rows</text>
  <line x1="260" y1="60" x2="328" y2="60" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d28a)"/>
  <line x1="530" y1="50" x2="598" y2="40" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d28a)"/>
  <line x1="530" y1="72" x2="598" y2="80" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d28a)"/>
  <line x1="260" y1="150" x2="328" y2="150" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d28a)"/>
</svg>
</div>

<h2>Microsoft.Extensions.AI: the abstraction layer</h2>
<div class="codeblock"><div class="codeblock-header">Chat.cs &mdash; provider-agnostic</div><pre><code>using Microsoft.Extensions.AI;

// One interface, many providers &mdash; swap via configuration:
IChatClient client = new ChatClientBuilder(
        new OllamaChatClient(new Uri("http://localhost:11434"), "llama3.1"))
    // or: new OpenAIClient(key).GetChatClient("gpt-4o-mini").AsIChatClient()
    .UseLogging()                       // see every request/response
    .UseFunctionInvocation()            // lets the model call your C# functions
    .Build();

var response = await client.GetResponseAsync(
    "Summarize: " + await File.ReadAllTextAsync("meeting-notes.txt"));
Console.WriteLine(response.Text);</code></pre></div>

<h2>Function calling: the model uses your C#</h2>
<div class="codeblock"><div class="codeblock-header">Tools.cs</div><pre><code>[Description("Get the current weather for a city")]
static string GetWeather(string city) =&gt;
    city.ToLowerInvariant() switch
    {
        "oslo"    =&gt; "4&deg;C, light snow",
        "seattle" =&gt; "11&deg;C, raining",
        _         =&gt; "20&deg;C, sunny"
    };

// With UseFunctionInvocation() the model can ask to run this method;
// the library executes it, feeds the result back, and returns the answer.
var reply = await client.GetResponseAsync("What's the weather in Oslo?",
    new ChatOptions { Tools = [AIFunctionFactory.Create(GetWeather)] });</code></pre></div>

<h2>RAG: chat with your data</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 140" width="820" height="140" role="img" aria-label="RAG pipeline">
  <defs><marker id="d28b" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="20" width="130" height="40" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="85" y="45" text-anchor="middle" class="dg-sub">1. chunk docs</text>
  <rect x="200" y="20" width="150" height="40" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="275" y="45" text-anchor="middle" class="dg-sub">2. embed chunks</text>
  <rect x="400" y="20" width="150" height="40" rx="8" fill="#ece8fe" stroke="#7c3aed"/><text x="475" y="45" text-anchor="middle" class="dg-sub">3. store vectors</text>
  <rect x="600" y="20" width="190" height="40" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="695" y="45" text-anchor="middle" class="dg-sub">4. query: embed &rarr; top-k</text>
  <rect x="600" y="90" width="190" height="40" rx="8" fill="#e7f8f1" stroke="#0e9f6e"/><text x="695" y="115" text-anchor="middle" class="dg-sub">5. LLM answers w/ context</text>
  <line x1="150" y1="40" x2="198" y2="40" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d28b)"/>
  <line x1="350" y1="40" x2="398" y2="40" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d28b)"/>
  <line x1="550" y1="40" x2="598" y2="40" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d28b)"/>
  <line x1="695" y1="60" x2="695" y2="88" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d28b)"/>
  <text x="310" y="105" text-anchor="middle" class="dg-sub">retrieval grounds the answer in YOUR documents &mdash; fewer hallucinations</text>
</svg>
</div>
<div class="codeblock"><div class="codeblock-header">Rag.cs</div><pre><code>// Embedding + vector store via the same abstraction style:
var embedder = new OllamaEmbeddingGenerator(new Uri("http://localhost:11434"), "all-minilm");

var vectorStore = new InMemoryVectorStore();    // swap for Qdrant/pgvector in prod
var collection = vectorStore.GetCollection&lt;int, DocChunk&gt;("docs");
await collection.CreateCollectionIfNotExistsAsync();

foreach (var chunk in Chunk(File.ReadAllText("handbook.md"), size: 800))
    await collection.UpsertAsync(new DocChunk
    {
        Id = Guid.NewGuid().GetHashCode(),
        Text = chunk,
        Embedding = await embedder.GenerateVectorAsync(chunk)
    });

// Query time:
var queryEmbedding = await embedder.GenerateVectorAsync(question);
var relevant = await collection.SearchAsync(queryEmbedding, topK: 3);
var context = string.Join("\n---\n", relevant.Results.Select(r =&gt; r.Record.Text));
var answer = await client.GetResponseAsync(
    $"Answer using ONLY this context:\n{context}\n\nQuestion: {question}");</code></pre></div>

<h2>Semantic Kernel vs Microsoft.Extensions.AI</h2>
<div class="table-wrap"><table>
<thead><tr><th></th><th>Microsoft.Extensions.AI</th><th>Semantic Kernel</th></tr></thead>
<tbody>
<tr><td>Level</td><td>primitives: IChatClient, tools, filters</td><td>framework: plugins, planners, agents</td></tr>
<tr><td>Analogy</td><td>Microsoft.Extensions.* abstractions</td><td>full orchestration suite</td></tr>
<tr><td>Use when</td><td>you want thin, DI-native building blocks</td><td>you want plugins, workflows, multi-agent</td></tr>
<tr><td>They interop</td><td colspan="2">SK builds on these same abstractions &mdash; they are complementary</td></tr>
</tbody></table></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (45 min)</div>
<p>Add a <code>chat</code> command to the tracker backed by a local Ollama model: the assistant may call <code>AddTask</code>/<code>ListTasks</code>/<code>CompleteTask</code> as functions ("remind me to buy milk tomorrow at 9"). Then index the README + course notes into the vector store and answer "what did I learn on day 11?" with citations. Watch the logging middleware &mdash; you are seeing tokens, costs, and latency live.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Program against abstractions (IChatClient); pick providers per environment.</li>
  <li>Function calling turns models into users of your typed APIs.</li>
  <li>RAG = chunk &rarr; embed &rarr; retrieve &rarr; answer with context.</li>
  <li>Log every AI call: tokens, latency, and cost are operational data.</li>
</ul>
`
};
