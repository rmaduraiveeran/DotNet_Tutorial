/* Day 30: Capstone & Next Steps */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[30] = {
  html: `
<p>Final day. You will assemble a portfolio capstone from everything learned, then map your next 90 days. This is not a lesson &mdash; it is a launch.</p>

<h2>The capstone: ShipTrack</h2>
<p>A complete product: <strong>a delivery-tracking platform</strong> with a public REST API, a Blazor dashboard, an Orleans-backed realtime tracking core, AI-powered delivery-time estimates, and full cloud-native deployment.</p>
<div class="diagram-wrap">
<svg viewBox="0 0 860 300" width="860" height="300" role="img" aria-label="Capstone architecture ShipTrack">
  <defs><marker id="d30a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="30" y="30" width="180" height="56" rx="10" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.4"/>
  <text x="120" y="52" text-anchor="middle" class="dg-text">Blazor dashboard</text><text x="120" y="70" text-anchor="middle" class="dg-sub">Day 19 &middot; MVVM ViewModels</text>
  <rect x="30" y="120" width="180" height="56" rx="10" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.4"/>
  <text x="120" y="142" text-anchor="middle" class="dg-text">Mobile (MAUI)</text><text x="120" y="160" text-anchor="middle" class="dg-sub">Day 23 &middot; driver app</text>
  <rect x="290" y="75" width="200" height="60" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/>
  <text x="390" y="97" text-anchor="middle" class="dg-text">Public REST API</text><text x="390" y="115" text-anchor="middle" class="dg-sub">Day 15-16, 20 &middot; JWT + OpenAPI</text>
  <rect x="560" y="30" width="270" height="56" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="695" y="52" text-anchor="middle" class="dg-text">Orleans tracking core</text><text x="695" y="70" text-anchor="middle" class="dg-sub">Day 25 &middot; ShipmentGrain per delivery</text>
  <rect x="560" y="120" width="270" height="56" rx="10" fill="#ece8fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="695" y="142" text-anchor="middle" class="dg-text">Estimation service (AI)</text><text x="695" y="160" text-anchor="middle" class="dg-sub">Day 28-29 &middot; IChatClient + evals</text>
  <rect x="290" y="220" width="200" height="56" rx="10" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/>
  <text x="390" y="242" text-anchor="middle" class="dg-text">EF Core + PostgreSQL</text><text x="390" y="260" text-anchor="middle" class="dg-sub">Day 17 &middot; migrations in CI</text>
  <rect x="560" y="220" width="270" height="56" rx="10" fill="#fdecec" stroke="#dc2626" stroke-width="1.5"/>
  <text x="695" y="242" text-anchor="middle" class="dg-text">Docker + K8s + OTel</text><text x="695" y="260" text-anchor="middle" class="dg-sub">Day 26 &middot; health-gated deploys</text>
  <line x1="210" y1="58" x2="288" y2="90" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d30a)"/>
  <line x1="210" y1="148" x2="288" y2="118" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d30a)"/>
  <line x1="490" y1="95" x2="558" y2="65" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d30a)"/>
  <line x1="490" y1="120" x2="558" y2="140" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d30a)"/>
  <line x1="390" y1="135" x2="390" y2="218" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d30a)"/>
  <line x1="695" y1="176" x2="695" y2="218" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d30a)"/>
</svg>
</div>

<h2>The build order (one focused week, or one month of evenings)</h2>
<div class="codeblock"><div class="codeblock-header">Milestones &mdash; each ends with a green build + commit</div><pre><code>M1  Domain + EF Core model, migrations, unit tests           (Days 5, 9, 13, 17)
M2  REST API: tasks &rarr; shipments, auth, validation, OpenAPI   (Days 15, 16, 20, 21)
M3  Orleans core: ShipmentGrain with persistent state + events (Day 25)
M4  Blazor dashboard consuming the API                        (Days 19, 22)
M5  AI estimation: IChatClient + function calling + eval set  (Days 28, 29)
M6  Dockerize + health checks + OTel + compose                (Day 26)
M7  README with architecture diagram, run instructions,
    screenshots, and a link to the live deployment</code></pre></div>
<div class="callout tip"><div class="co-title">Scope guardrails</div><p>Every feature not in the list above is a trap. A small, polished, deployed system with tests and a real architecture diagram beats a sprawling half-working monolith &mdash; in interviews and in practice.</p></div>

<h2>The .NET skills map &mdash; where you are now</h2>
<div class="table-wrap"><table>
<thead><tr><th>Area</th><th>You learned</th><th>Keep sharp with</th></tr></thead>
<tbody>
<tr><td>Language</td><td>types, LINQ, generics, async, patterns</td><td>read the C# release notes each November</td></tr>
<tr><td>Testing</td><td>xUnit, fakes, integration tests, TDD</td><td>test coverage on every capstone feature</td></tr>
<tr><td>Web</td><td>minimal APIs, MVC, Blazor, auth, EF Core</td><td>ship the API publicly; iterate on feedback</td></tr>
<tr><td>Architecture</td><td>DI, options, microservices, resilience, Orleans</td><td>draw every system before you code it</td></tr>
<tr><td>Cloud</td><td>Docker, health checks, OpenTelemetry</td><td>deploy for real; pages teach what tutorials cannot</td></tr>
<tr><td>AI</td><td>IChatClient, RAG, function calling, evals</td><td>one AI feature in every project from now on</td></tr>
</tbody></table></div>

<h2>Your next 90 days</h2>
<ul>
  <li><strong>Days 1&ndash;30</strong>: finish and deploy the capstone. Iterate on real feedback.</li>
  <li><strong>Days 31&ndash;60</strong>: read one deep book end-to-end &mdash; <em>.NET in Action</em>, <em>Domain-Driven Design</em> (Evans), or <em>Concurrency in C#</em> (Novikov). Contribute one PR to an OSS .NET project you use.</li>
  <li><strong>Days 61&ndash;90</strong>: go deep on a specialization &mdash; performance (Day 27 forever), distributed systems/Orleans, or AI engineering. Write about it publicly.</li>
</ul>
<div class="callout note"><div class="co-title">Staying current is a skill</div><p>Every November a new .NET ships; every LTS is 3 years of runway. Follow the <a href="https://learn.microsoft.com/en-us/dotnet/" target="_blank" rel="noopener">official docs</a>, the <code>dotnet</code> GitHub org, and one conference's talks per year. Depth beats novelty: the fundamentals you practiced for 30 days outlive any release.</p></div>

<h2>Final exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Ship something (today)</div>
<p>Clone your Day 21 API into a new repository named <code>shiptrack</code>, complete M1 and M2 today even if small, and publish the repository with a real README. Deployment can wait for tomorrow &mdash; but a public commit with a green test badge is your line between "did a tutorial" and "builds software".</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>You can now build: APIs, UIs, data layers, distributed cores, AI features.</li>
  <li>The capstone is the portfolio &mdash; small, polished, deployed, documented.</li>
  <li>Specialize next; depth in one area compounds faster than breadth.</li>
  <li>Ship, get feedback, ship again. That loop <em>is</em> the career.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Add a GitHub Actions deploy step to Azure App Service / Fly.io on tag push.</li><li>Write an architecture decision record (ADR) for one real choice you made.</li><li>Record a 2-minute demo video of the deployed capstone &mdash; the best README is motion.</li></ul>
`,
  quiz: [
    {
      "q": "A portfolio capstone should be…",
      "a": [
        "Huge and half-done",
        "Small, polished, deployed, documented, tested",
        "A TODO app",
        "Private"
      ],
      "correct": 1,
      "expl": "Depth beats breadth; deployment proves it runs for real."
    },
    {
      "q": "The capstone milestone order starts with…",
      "a": [
        "Deployment",
        "Domain + persistence, then API, then UI/AI/infra",
        "UI first",
        "AI first"
      ],
      "correct": 1,
      "expl": "Foundation first — each milestone ends green and committed."
    },
    {
      "q": "After the 30 days, the recommendation is…",
      "a": [
        "Stop",
        "Specialize deeply in one area (perf/distributed/AI)",
        "Learn another language",
        "Only certifications"
      ],
      "correct": 1,
      "expl": "Depth compounds faster than breadth."
    },
    {
      "q": "'Ship, get feedback, ship again' means…",
      "a": [
        "Ship once",
        "The shipping loop IS the career skill",
        "Feedback is optional",
        "Ship in secret"
      ],
      "correct": 1,
      "expl": "Real users and real deployments teach what tutorials cannot."
    }
  ]

};