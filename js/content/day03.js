/* Day 3: Control Flow & Methods */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[3] = {
  html: `
<p>Programs are data plus <em>decisions</em>. Today: branching, loops, and how to package logic into methods the way professional codebases do.</p>

<h2>Branching</h2>
<div class="codeblock"><div class="codeblock-header">ControlFlow.cs</div><pre><code>int temperature = 28;

// Classic if / else if / else
if (temperature &gt; 30)       Console.WriteLine("Hot");
else if (temperature &gt; 20)  Console.WriteLine("Pleasant");
else                        Console.WriteLine("Cold");

// Ternary &mdash; an expression, so it can be assigned:
string mood = temperature &gt; 25 ? "sunny" : "cloudy";

// switch expression (modern C#) &mdash; exhaustive and compact:
string activity = temperature switch
{
    &gt; 30 =&gt; "swimming",
    &gt; 20 =&gt; "hiking",
    &gt; 10 =&gt; "jogging",
    _    =&gt; "reading indoors"
};</code></pre></div>

<h2>Loops</h2>
<div class="codeblock"><div class="codeblock-header">Loops.cs</div><pre><code>// foreach &mdash; for anything enumerable (the default choice)
foreach (var letter in "abc")
    Console.Write(letter + " ");          // a b c

// for &mdash; when you need the index
for (int i = 0; i &lt; 3; i++)
    Console.WriteLine($"iteration {i}");

// while / do-while &mdash; when the count is unknown
int fuel = 3;
while (fuel &gt; 0) { fuel--; }

// Control keywords: break exits the loop, continue skips to the next pass.
for (int i = 1; i &lt;= 5; i++)
{
    if (i == 2) continue;
    if (i == 4) break;
    Console.Write(i + " ");               // 1 3
}</code></pre></div>

<h2>Methods: parameters by value, by reference, and optional</h2>
<div class="codeblock"><div class="codeblock-header">Methods.cs</div><pre><code>// Expression-bodied method &mdash; a single expression after =&gt;
static double Tax(decimal amount, double rate = 0.19) =&gt;     // optional parameter
    (double)amount * rate;

// out parameter &mdash; the method *returns* a second value through it
static bool SplitName(string full, out string first, out string last)
{
    var parts = full.Split(' ', 2);
    first = parts[0];
    last  = parts.Length &gt; 1 ? parts[1] : "";
    return parts.Length &gt; 1;
}

// params &mdash; variable argument count
static int Max(params int[] numbers) =&gt; numbers.Max();

// ref &mdash; the caller's variable is modified (use sparingly)
static void Bump(ref int n) =&gt; n++;

string full = "Ada Lovelace";
if (SplitName(full, out var first, out var last))
    Console.WriteLine($"first={first}, last={last}");   // first=Ada, last=Lovelace</code></pre></div>
<div class="callout note"><div class="co-title">out vs ref vs return</div><p>Prefer plain <code>return</code> and tuples (<code>(string, int) Find()</code>) in modern code. <code>out</code> is idiomatic for Try-pattern methods (<code>int.TryParse</code>). <code>ref</code> is rare &mdash; performance code mostly.</p></div>

<h2>Method design rules that scale</h2>
<ul>
  <li><strong>One job per method.</strong> If the name needs &ldquo;and&rdquo;, split it.</li>
  <li><strong>Name = verb + noun</strong> (<code>CalculateTax</code>, <code>TryParse</code>, <code>IsExpired</code>).</li>
  <li><strong>3 or fewer parameters</strong> is a good smell; beyond that, pass an options object.</li>
  <li><strong>Fail fast</strong>: validate arguments at the top (<code>ArgumentException.ThrowIfNull(x)</code>).</li>
</ul>
<div class="diagram-wrap">
<svg viewBox="0 0 780 120" width="780" height="120" role="img" aria-label="Method call flow">
  <defs><marker id="d3a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="40" width="160" height="44" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="100" y="60" text-anchor="middle" class="dg-text">Caller</text><text x="100" y="76" text-anchor="middle" class="dg-sub">passes arguments</text>
  <rect x="300" y="40" width="180" height="44" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="390" y="60" text-anchor="middle" class="dg-text">Method body</text><text x="390" y="76" text-anchor="middle" class="dg-sub">does one job</text>
  <rect x="600" y="40" width="160" height="44" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="680" y="60" text-anchor="middle" class="dg-text">Return value</text><text x="680" y="76" text-anchor="middle" class="dg-sub">(or exception)</text>
  <line x1="180" y1="62" x2="292" y2="62" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d3a)"/>
  <line x1="480" y1="62" x2="592" y2="62" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d3a)"/>
</svg>
</div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (25 min)</div>
<p>Write a <code>FizzBuzz</code> method for 1&ndash;100 using a switch expression on <code>(n % 3, n % 5)</code>. Then write <code>static bool IsPalindrome(string text)</code> that ignores case and spaces. Both must be pure functions (no console output inside &mdash; return values instead, and print at the call site).</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Switch expressions beat if/else chains for mapping values to results.</li>
  <li><code>foreach</code> by default; <code>for</code> only when the index matters.</li>
  <li>Methods should be small, verb-named, and validate early.</li>
  <li>Tuples and out parameters give you multiple &ldquo;returns&rdquo; cleanly.</li>
</ul>
`
};
