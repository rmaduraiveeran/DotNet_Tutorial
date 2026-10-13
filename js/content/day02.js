/* Day 2: C# Fundamentals */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[2] = {
  html: `
<p>Today we cover the type system, variables, and operators &mdash; the vocabulary of every C# program you will ever read.</p>

<h2>Strong, static types (and why you should care)</h2>
<p>C# is <strong>statically typed</strong>: every variable has a type known at compile time. The compiler catches whole categories of bugs before your program ever runs. Types come in two families:</p>
<ul>
  <li><strong>Value types</strong> (struct, enum) &mdash; the variable <em>is</em> the data. Assignment copies it. Lives on the stack (usually).</li>
  <li><strong>Reference types</strong> (class, string, array, delegate) &mdash; the variable <em>points to</em> the data. Assignment copies the reference, not the object.</li>
</ul>
<div class="diagram-wrap">
<svg viewBox="0 0 820 170" width="820" height="170" role="img" aria-label="Value types copy data, reference types copy the reference">
  <text x="120" y="26" text-anchor="middle" class="dg-text">Value type</text>
  <rect x="60" y="40" width="120" height="40" rx="6" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="120" y="65" text-anchor="middle" class="dg-sub">a = 42</text>
  <rect x="60" y="100" width="120" height="40" rx="6" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="120" y="125" text-anchor="middle" class="dg-sub">b = 42 (copy)</text>
  <text x="120" y="160" text-anchor="middle" class="dg-sub">b = a copies the value; changing b never touches a</text>
  <text x="470" y="26" text-anchor="middle" class="dg-text">Reference type</text>
  <rect x="380" y="40" width="120" height="40" rx="6" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="440" y="65" text-anchor="middle" class="dg-sub">x &#8594; obj#1</text>
  <rect x="380" y="100" width="120" height="40" rx="6" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="440" y="125" text-anchor="middle" class="dg-sub">y &#8594; obj#1</text>
  <rect x="600" y="70" width="140" height="40" rx="6" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="670" y="95" text-anchor="middle" class="dg-sub">obj#1 on the heap</text>
  <line x1="500" y1="60" x2="596" y2="85" stroke="#8a919e" stroke-width="1.2"/>
  <line x1="500" y1="120" x2="596" y2="95" stroke="#8a919e" stroke-width="1.2"/>
  <text x="470" y="160" text-anchor="middle" class="dg-sub">y = x copies the arrow; both see the same object</text>
</svg>
</div>

<h2>Variables, var, and constants</h2>
<div class="codeblock"><div class="codeblock-header">Fundamentals.cs</div><pre><code>int age = 30;                    // explicitly typed
var name = "Ada";                // compiler infers string &mdash; still strongly typed!
const double Pi = 3.14159;       // compile-time constant
string message = $"Hi {name}, age {age}";   // string interpolation

// Conversion: explicit casts can lose data; TryParse never throws.
string raw = "42";
if (int.TryParse(raw, out int parsed))
    Console.WriteLine($"Parsed {parsed}");</code></pre></div>

<h2>The types you will use constantly</h2>
<div class="table-wrap"><table>
<thead><tr><th>Type</th><th>Kind</th><th>Example</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><code>int</code>, <code>long</code></td><td>value</td><td><code>int n = 5;</code></td><td>32/64-bit signed integers</td></tr>
<tr><td><code>double</code>, <code>decimal</code></td><td>value</td><td><code>decimal p = 9.99m;</code></td><td>Use <code>decimal</code> for money!</td></tr>
<tr><td><code>bool</code></td><td>value</td><td><code>bool ok = true;</code></td><td>true / false</td></tr>
<tr><td><code>char</code></td><td>value</td><td><code>char c = 'A';</code></td><td>Single UTF-16 code unit</td></tr>
<tr><td><code>string</code></td><td>reference</td><td><code>string s = "hi";</code></td><td>Immutable sequence of char</td></tr>
<tr><td><code>DateTime</code>, <code>TimeSpan</code></td><td>value</td><td><code>var now = DateTime.UtcNow;</code></td><td>Always store UTC</td></tr>
<tr><td><code>T?</code> (nullable)</td><td>value wrapper</td><td><code>int? maybe = null;</code></td><td>Value type that can be &ldquo;missing&rdquo;</td></tr>
<tr><td><code>object</code></td><td>reference</td><td>&mdash;</td><td>Root of the type system; avoid when possible</td></tr>
</tbody></table></div>

<h2>Nullability: the modern contract</h2>
<p>Since .NET 6, <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code> is the default in new projects. The compiler now warns you when a reference type might be null, and you declare intent explicitly:</p>
<div class="codeblock"><div class="codeblock-header">Nullability.cs</div><pre><code>string notNull = "always set";          // can never be null
string? maybeNull = null;               // ? declares "this CAN be null"

// The compiler forces you to check before using maybeNull:
int length = maybeNull?.Length ?? 0;    // null-conditional + null-coalescing
Console.WriteLine(length);              // 0, no NullReferenceException</code></pre></div>
<div class="callout tip"><div class="co-title">The two null operators</div><p><code>x?.Y</code> evaluates to null instead of throwing when x is null. <code>x ?? fallback</code> substitutes fallback when x is null. Together they replace most old-style <code>if (x != null)</code> checks.</p></div>

<h2>Operators &amp; pattern matching preview</h2>
<div class="codeblock"><div class="codeblock-header">Operators.cs</div><pre><code>int a = 10, b = 3;
Console.WriteLine(a / b);          // 3   (integer division!)
Console.WriteLine((double)a / b);  // 3.333...
Console.WriteLine(a % b);          // 1   (remainder)

// switch expressions with patterns &mdash; much cleaner than if/else chains:
string Describe(int score) =&gt; score switch
{
    &gt;= 90 =&gt; "excellent",
    &gt;= 70 =&gt; "good",
    &gt;= 50 =&gt; "pass",
    _     =&gt; "fail"           // _ is the discard / default arm
};</code></pre></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (20 min)</div>
<p>Write a console program that: (1) asks for a price and quantity, (2) computes the total with <code>decimal</code>, (3) applies a discount chosen with a switch expression (10% over $100, 5% over $50, none otherwise), and (4) prints a formatted receipt line with <code>:F2</code> formatting. Deliberately try <code>double</code> for money first and inspect the rounding artifacts you get.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Static typing catches bugs at compile time; <code>var</code> is convenience, not dynamic typing.</li>
  <li>Value types copy; reference types share.</li>
  <li><code>decimal</code> for money, <code>double</code> for physics.</li>
  <li>Nullable reference types turn runtime crashes into compiler warnings.</li>
</ul>
`
};
