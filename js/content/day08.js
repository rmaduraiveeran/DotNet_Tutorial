/* Day 8: Delegates, Events & Lambdas */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[8] = {
  html: `
<p>Delegates are typed function references &mdash; the foundation of events, LINQ, callbacks, and middleware. Today you learn to pass behavior around like data.</p>

<h2>From delegate to lambda in three steps</h2>
<div class="codeblock"><div class="codeblock-header">Evolution.cs</div><pre><code>// 1. Named method + delegate type (C# 1.0 style)
int Add(int a, int b) =&gt; a + b;
Func&lt;int, int, int&gt; op1 = Add;

// 2. Anonymous method (C# 2.0)
Func&lt;int, int, int&gt; op2 = delegate (int a, int b) { return a + b; };

// 3. Lambda (today) &mdash; a delegate is just a variable holding a function:
Func&lt;int, int, int&gt; add = (a, b) =&gt; a + b;
Func&lt;int, int&gt; square = x =&gt; x * x;
Action&lt;string&gt; log = msg =&gt; Console.WriteLine(msg);   // Action = returns void

Console.WriteLine(add(2, 3));      // 5
Console.WriteLine(square(add(2, 3)));  // 25 &mdash; functions as values</code></pre></div>
<div class="callout note"><div class="co-title">Func vs Action vs Predicate</div><p><code>Func&lt;T1.., TResult&gt;</code> returns a value (last type param = return). <code>Action&lt;T1..&gt;</code> returns void. <code>Predicate&lt;T&gt;</code> is <code>Func&lt;T,bool&gt;</code>. You will rarely declare custom delegate types anymore.</p></div>

<h2>Events: the observer pattern built in</h2>
<p>An <code>event</code> is a delegate with guard rails: publishers raise it, subscribers hook in, and subscribers cannot overwrite each other or invoke it directly.</p>
<div class="codeblock"><div class="codeblock-header">Events.cs</div><pre><code>public class Thermostat
{
    private double _temperature;

    public event Action&lt;double&gt;? TemperatureChanged;   // the contract

    public double Temperature
    {
        get =&gt; _temperature;
        set
        {
            _temperature = value;
            TemperatureChanged?.Invoke(value);   // ?. &mdash; no subscribers, no problem
        }
    }
}

// Subscribers:
var t = new Thermostat();
t.TemperatureChanged += temp =&gt; Console.WriteLine($"Now {temp:F1}&deg;C");
t.Temperature = 22.5;                     // prints: Now 22.5&deg;C</code></pre></div>
<div class="diagram-wrap">
<svg viewBox="0 0 800 140" width="800" height="140" role="img" aria-label="Event flow">
  <defs><marker id="d8a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="45" width="180" height="50" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="110" y="66" text-anchor="middle" class="dg-text">Publisher</text><text x="110" y="82" text-anchor="middle" class="dg-sub">raises the event</text>
  <rect x="310" y="45" width="180" height="50" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="400" y="66" text-anchor="middle" class="dg-text">event field</text><text x="400" y="82" text-anchor="middle" class="dg-sub">list of handlers</text>
  <rect x="600" y="20" width="180" height="40" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="690" y="45" text-anchor="middle" class="dg-sub">Subscriber A</text>
  <rect x="600" y="80" width="180" height="40" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="690" y="105" text-anchor="middle" class="dg-sub">Subscriber B</text>
  <line x1="200" y1="70" x2="308" y2="70" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d8a)"/>
  <line x1="490" y1="60" x2="598" y2="40" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d8a)"/>
  <line x1="490" y1="80" x2="598" y2="100" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d8a)"/>
</svg>
</div>

<h2>Closures: lambdas capture variables</h2>
<div class="codeblock"><div class="codeblock-header">Closures.cs</div><pre><code>int counter = 0;
Action increment = () =&gt; counter++;     // captures the *variable*, not the value
increment(); increment();
Console.WriteLine(counter);             // 2 &mdash; the outer variable changed

// The classic foreach trap is gone in modern C# (loop var is per-iteration),
// but watch out for captured loop state you mutate intentionally.</code></pre></div>

<h2>Where you will meet delegates in this course</h2>
<ul>
  <li><strong>Day 6 LINQ</strong>: every <code>Where(p =&gt; ...)</code> passes a lambda.</li>
  <li><strong>Day 11 async</strong>: <code>ContinueWith</code>, <code>CancellationToken.Register</code>.</li>
  <li><strong>Day 15 middleware</strong>: <code>app.Use(async (ctx, next) =&gt; ...)</code>.</li>
  <li><strong>Day 22 MVVM</strong>: commands are delegates the UI invokes.</li>
</ul>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (25 min)</div>
<p>Create a <code>StockTicker</code> class with a <code>PriceChanged</code> event carrying <code>(string Symbol, decimal OldPrice, decimal NewPrice)</code>. Subscribe two lambdas: one that logs, one that raises an alert when the change exceeds 2%. Then write a tiny <code>Pipeline&lt;T&gt;</code> class that stores a list of <code>Func&lt;T,T&gt;</code> steps and applies them in order.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Delegates = typed function references; lambdas are their modern syntax.</li>
  <li><code>event</code> adds encapsulation on top of a delegate field.</li>
  <li><code>?.</code> before invoking events avoids null storms.</li>
  <li>Lambdas capture variables &mdash; that is both their power and their trap.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Build <code>EventAggregator</code> &mdash; a static class with <code>Publish&lt;T&gt;/Subscribe&lt;T&gt;</code> using delegates + weak references.</li><li>Create a <code>Pipeline&lt;T&gt;</code> where each step can short-circuit (return null) and verify downstream steps are skipped.</li><li>Demonstrate the closure-in-loop bug with a pre-C#5 style <code>for</code> loop, then fix it two ways.</li></ul>
`,
  quiz: [
    {
      "q": "Func<int,int,bool> is…",
      "a": [
        "A class",
        "A delegate type: two int inputs, bool result",
        "An event",
        "A lambda keyword"
      ],
      "correct": 1,
      "expl": "Func's last type parameter is the return type."
    },
    {
      "q": "event Action<double>? Changed; — why invoke with ?. ?",
      "a": [
        "Style",
        "No subscribers = null; ?. avoids NullReferenceException",
        "Performance",
        "Thread safety"
      ],
      "correct": 1,
      "expl": "Changed?.Invoke(x) is the safe raise pattern."
    },
    {
      "q": "A closure means the lambda…",
      "a": [
        "Copies variables",
        "Captures the variable itself, not its value",
        "Cannot access locals",
        "Creates a new scope always"
      ],
      "correct": 1,
      "expl": "Captured variables live as long as the delegate — that is both the power and the trap."
    },
    {
      "q": "Where do delegates NOT naturally appear?",
      "a": [
        "LINQ predicates",
        "Middleware pipelines",
        "MVM commands",
        "GC generations"
      ],
      "correct": 3,
      "expl": "The GC is runtime machinery — the other three are delegate-based designs."
    }
  ]

};