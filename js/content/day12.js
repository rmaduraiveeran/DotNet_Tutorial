/* Day 12: File I/O, JSON & Serialization */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[12] = {
  html: `
<p>Data leaves your program constantly: config files, HTTP payloads, exports. Today: streams, async file I/O, and System.Text.Json &mdash; the serializer built into modern .NET.</p>

<h2>Files: read, write, stream</h2>
<div class="codeblock"><div class="codeblock-header">FileIo.cs</div><pre><code>// Whole-file helpers &mdash; fine for small files:
string text = await File.ReadAllTextAsync("notes.txt");
await File.WriteAllTextAsync("out.txt", "generated report");

// Line-by-line streaming &mdash; correct for huge files (constant memory):
await foreach (var line in File.ReadLinesAsync("big.log"))
    Console.WriteLine(line[..Math.Min(80, line.Length)]);

// Streaming copy &mdash; never loads the file fully:
await using var source = File.OpenRead("movie.mp4");
await using var target = File.Create("copy.mp4");
await source.CopyToAsync(target);</code></pre></div>
<div class="callout tip"><div class="co-title">ReadAll vs streams</div><p><code>ReadAllText</code> loads everything into memory &mdash; perfect under a few MB, a liability at 2 GB. Streams process in chunks with constant memory. Default to streams for anything user-provided or log-sized.</p></div>

<h2>System.Text.Json: serialize &amp; deserialize</h2>
<div class="codeblock"><div class="codeblock-header">Json.cs</div><pre><code>using System.Text.Json;
using System.Text.Json.Serialization;

public record WeatherReport(
    [property: JsonPropertyName("location")] string Location,
    [property: JsonPropertyName("temp_c")]   double TempC,
    DateTime RecordedAtUtc);

var report = new WeatherReport("Oslo", 4.5, DateTime.UtcNow);

// Serialize &mdash; indented for humans, camelCase for APIs:
var options = new JsonSerializerOptions
{
    WriteIndented = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
};
string json = JsonSerializer.Serialize(report, options);

// Deserialize &mdash; returns null on null input, throws JsonException on bad shape:
WeatherReport? back = JsonSerializer.Deserialize&lt;WeatherReport&gt;(json, options);

// Async from a stream (no giant string in memory):
await using var fs = File.OpenRead("weather.json");
var fromFile = await JsonSerializer.DeserializeAsync&lt;WeatherReport&gt;(fs);</code></pre></div>

<h2>JSON to objects: the full contract</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 120" width="820" height="120" role="img" aria-label="Serialization contract">
  <defs><marker id="d12a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="35" width="200" height="50" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="120" y="56" text-anchor="middle" class="dg-text">C# object</text><text x="120" y="72" text-anchor="middle" class="dg-sub">typed &middot; in memory</text>
  <rect x="310" y="35" width="200" height="50" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="410" y="56" text-anchor="middle" class="dg-text">JSON text</text><text x="410" y="72" text-anchor="middle" class="dg-sub">portable &middot; on the wire</text>
  <rect x="600" y="35" width="200" height="50" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="700" y="56" text-anchor="middle" class="dg-text">C# object</text><text x="700" y="72" text-anchor="middle" class="dg-sub">(possibly another machine)</text>
  <line x1="220" y1="55" x2="308" y2="55" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d12a)"/>
  <text x="264" y="45" text-anchor="middle" class="dg-sub">Serialize</text>
  <line x1="510" y1="55" x2="598" y2="55" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d12a)"/>
  <text x="554" y="45" text-anchor="middle" class="dg-sub">Deserialize</text>
</svg>
</div>
<p>The contract is metadata: property names map by convention (or <code>JsonPropertyName</code>), constructors map by parameter name (records are ideal), and unknown JSON properties are ignored unless you opt into strictness. Version your APIs by making new fields optional &mdash; old payloads keep deserializing.</p>

<h2>Records + JSON = painless DTOs</h2>
<div class="codeblock"><div class="codeblock-header">Dto.cs</div><pre><code>// Immutable, value-equal, serializable &mdash; the default DTO choice:
public record OrderDto(int Id, string Customer, decimal Total, string? Coupon = null);

var dto = new OrderDto(7, "Ada", 129.90m);
// {"id":7,"customer":"Ada","total":129.90,"coupon":null}
// Round-trips with zero configuration beyond naming policy.</code></pre></div>

<h2>When JSON is not enough</h2>
<div class="table-wrap"><table>
<thead><tr><th>Format</th><th>Best for</th><th>Package</th></tr></thead>
<tbody>
<tr><td>JSON</td><td>APIs, config, interop</td><td>built-in (System.Text.Json)</td></tr>
<tr><td>XML</td><td>Legacy/enterprise contracts</td><td><code>System.Xml</code>, XmlSerializer</td></tr>
<tr><td>MessagePack / Protobuf</td><td>Compact binary, gRPC, queues</td><td>MemoryPack, protobuf-net</td></tr>
<tr><td>CSV</td><td>Spreadsheets, exports</td><td>CsvHelper</td></tr>
</tbody></table></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (25 min)</div>
<p>Extend Day 7's task tracker with <code>export</code> and <code>import</code> commands: export filters completed tasks to a JSON file (camelCase, indented), import merges without duplicating IDs (skip or reassign &mdash; your choice, document it). Then export a CSV of open tasks by hand-formatting with proper quoting.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Small files: helpers. Big files: streams, always.</li>
  <li>System.Text.Json with explicit options beats defaults in production.</li>
  <li>Records are the DTO sweet spot.</li>
  <li>Design schemas for versioning: add optional fields, never rename.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Add round-trip JSON pretty-printing: read a file, reformat with 4-space indent.</li><li>Implement <code>static T? LoadOrCreate&lt;T&gt;(string path)</code> that survives missing files and corrupt JSON.</li><li>Serialize a <code>Dictionary&lt;DateTime, List&lt;string&gt;&gt;</code> and back &mdash; then make DateTime round-trip exactly.</li></ul>
`,
  quiz: [
    {
      "q": "Reading a 2GB log file — correct approach:",
      "a": [
        "File.ReadAllTextAsync",
        "Stream line-by-line with File.ReadLinesAsync",
        "byte[] buffer all at once",
        "String interpolation"
      ],
      "correct": 1,
      "expl": "Streams keep memory constant regardless of file size."
    },
    {
      "q": "JsonPropertyName(\"temp_c\") is used to…",
      "a": [
        "Encrypt fields",
        "Map a C# property to a JSON name",
        "Ignore a property",
        "Format numbers"
      ],
      "correct": 1,
      "expl": "Attribute-level contract control for wire formats."
    },
    {
      "q": "Records make good DTOs because…",
      "a": [
        "They serialize faster",
        "Immutable + value equality + positional constructors",
        "They are smaller",
        "They validate themselves"
      ],
      "correct": 1,
      "expl": "Perfect fit for wire contracts — plus with-cloning for updates."
    },
    {
      "q": "Designing for schema evolution, you should…",
      "a": [
        "Rename fields aggressively",
        "Add optional fields, never rename",
        "Version via new tables only",
        "Avoid JSON"
      ],
      "correct": 1,
      "expl": "Optional additions keep old payloads deserializing."
    }
  ]

};