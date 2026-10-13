/* Day 22: MVVM Pattern */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[22] = {
  html: `
<p>MVVM (Model-View-ViewModel) is the pattern behind WPF, WinUI, and .NET MAUI: the View binds to a ViewModel, state changes flow to the screen automatically. It is also, increasingly, a pattern for Blazor and Avalonia apps.</p>

<h2>The three roles</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 200" width="820" height="200" role="img" aria-label="MVVM structure and data flow">
  <defs><marker id="d22a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="40" y="60" width="180" height="70" rx="10" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.5"/>
  <text x="130" y="88" text-anchor="middle" class="dg-text">View (.xaml)</text>
  <text x="130" y="106" text-anchor="middle" class="dg-sub">declarative UI &middot; bindings</text>
  <rect x="320" y="60" width="180" height="70" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="410" y="88" text-anchor="middle" class="dg-text">ViewModel</text>
  <text x="410" y="106" text-anchor="middle" class="dg-sub">state &middot; commands &middot; INPC</text>
  <rect x="600" y="60" width="180" height="70" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/>
  <text x="690" y="88" text-anchor="middle" class="dg-text">Model</text>
  <text x="690" y="106" text-anchor="middle" class="dg-sub">domain &middot; services</text>
  <line x1="220" y1="85" x2="318" y2="85" stroke="#6c5ce7" stroke-width="1.6" marker-end="url(#d22a)"/>
  <text x="269" y="75" text-anchor="middle" class="dg-sub">data binding</text>
  <line x1="500" y1="85" x2="598" y2="85" stroke="#8a919e" stroke-width="1.6" marker-end="url(#d22a)"/>
  <text x="549" y="75" text-anchor="middle" class="dg-sub">calls services</text>
  <text x="410" y="175" text-anchor="middle" class="dg-sub">View knows ViewModel &middot; ViewModel knows Model &middot; Model knows neither &mdash; that is what makes VMs unit-testable</text>
</svg>
</div>

<h2>INotifyPropertyChanged: the engine of binding</h2>
<div class="codeblock"><div class="codeblock-header">The plumbing (once upon a time)</div><pre><code>public class CounterViewModel : INotifyPropertyChanged
{
    private int _count;
    public int Count
    {
        get =&gt; _count;
        set
        {
            if (_count == value) return;
            _count = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Count)));
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;
}</code></pre></div>
<div class="codeblock"><div class="codeblock-header">The modern way &mdash; CommunityToolkit.Mvvm source generators</div><pre><code>using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class CounterViewModel : ObservableObject
{
    [ObservableProperty]                // generates Count + INPC + change hooks
    private int count;

    [ObservableProperty]
    private bool isBusy;

    [RelayCommand]                      // generates CountUpCommand : IRelayCommand
    private void CountUp() =&gt; Count++;

    [RelayCommand(CanExecute = nameof(CanReset))]
    private void Reset() =&gt; Count = 0;
    private bool CanReset() =&gt; Count &gt; 0 &amp;&amp; !IsBusy;
}</code></pre></div>

<h2>The XAML side</h2>
<div class="codeblock"><div class="codeblock-header">CounterPage.xaml (WPF / MAUI)</div><pre><code>&lt;ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:vm="clr-namespace:App.ViewModels"
             x:Class="App.CounterPage"&gt;

  &lt;ContentPage.BindingContext&gt;      &lt;!-- wire-up (or via DI in code-behind) --&gt;
    &lt;vm:CounterViewModel /&gt;
  &lt;/ContentPage.BindingContext&gt;

  &lt;VerticalStackLayout Padding="30" Spacing="10"&gt;
    &lt;Label Text="{Binding Count, StringFormat='Count: {0}'}"
           FontSize="40" /&gt;
    &lt;Button Text="Up" Command="{Binding CountUpCommand}" /&gt;
    &lt;Button Text="Reset" Command="{Binding ResetCommand}" /&gt;
  &lt;/VerticalStackLayout&gt;
&lt;/ContentPage&gt;</code></pre></div>

<h2>Why commands, not click handlers</h2>
<p><code>Button.Click</code> couples UI to code-behind. <code>Command="{Binding ResetCommand}"</code> gives you: CanExecute auto-disabling the button, testability (invoke the command in a unit test, no UI required), and one VM shared across desktop/mobile platforms.</p>
<div class="codeblock"><div class="codeblock-header">CounterViewModelTests.cs</div><pre><code>[Fact]
public void Reset_ClearsCount_AndRespectsCanExecute()
{
    var vm = new CounterViewModel();
    vm.CountUpCommand.Execute(null);
    vm.CountUpCommand.Execute(null);
    Assert.Equal(2, vm.Count);

    Assert.True(vm.ResetCommand.CanExecute(null));
    vm.ResetCommand.Execute(null);
    Assert.Equal(0, vm.Count);
}</code></pre></div>

<h2>Where MVVM shows up beyond XAML</h2>
<ul>
  <li><strong>Blazor</strong>: components + <code>INotifyPropertyChanged</code> ViewModels give the same testability (Day 19's components become thin render shells).</li>
  <li><strong>Async flows</strong>: <code>[RelayCommand(IncludeCancelCommand = true)]</code> generates cancellable commands &mdash; perfect for load buttons.</li>
  <li><strong>Messenger</strong>: <code>WeakReferenceMessenger</code> decouples VMs that must talk (cross-VM events without references).</li>
</ul>
<div class="callout warning"><div class="co-title">Two classic MVVM bugs</div><p>(1) Setting a bound property from a background thread crashes the UI &mdash; marshal with <code>Dispatcher</code> before assigning. (2) Forgetting to raise change notifications on collection <em>element</em> changes &mdash; use <code>ObservableCollection&lt;T&gt;</code> for lists the UI renders.</p></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (35 min)</div>
<p>Build a <code>TaskListViewModel</code> (observable properties: items, filter, isBusy; relay commands: load, complete, remove with CanExecute). Unit-test it against a fake <code>ITaskService</code> &mdash; zero UI. Then bind it in a tiny MAUI or WPF window, or reuse it inside a Blazor component to prove the pattern is UI-agnostic.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>View binds to ViewModel; ViewModel owns state and commands.</li>
  <li>Source generators remove the INPC boilerplate entirely.</li>
  <li>Commands carry enable/disable logic &mdash; test VMs without a screen.</li>
  <li>The pattern transfers: WPF, MAUI, Avalonia, even Blazor.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Add <code>[RelayCommand(IncludeCancelCommand = true)]</code> to a slow load command &mdash; cancel mid-flight and observe.</li><li>Implement a <code>DesignTimeViewModel</code> with sample data for the XAML designer.</li><li>Use <code>WeakReferenceMessenger</code> to send a &ldquo;task completed&rdquo; message from VM to VM.</li></ul>
`,
  quiz: [
    {
      "q": "In MVVM, the ViewModel…",
      "a": [
        "Renders HTML",
        "Owns state + commands, testable without UI",
        "Is the database",
        "Replaces the View"
      ],
      "correct": 1,
      "expl": "View binds to VM; VM knows no UI types."
    },
    {
      "q": "[ObservableProperty] generates…",
      "a": [
        "A database column",
        "A property with INotifyPropertyChanged wiring",
        "A command",
        "A view"
      ],
      "correct": 1,
      "expl": "Source generators remove the INPC boilerplate."
    },
    {
      "q": "Commands (ICommand) beat click handlers because they…",
      "a": [
        "Run faster",
        "Carry CanExecute enabling/disabling + testability",
        "Avoid XAML",
        "Are async-only"
      ],
      "correct": 1,
      "expl": "Button auto-disables; unit tests invoke commands directly."
    },
    {
      "q": "Setting a bound property from a background thread…",
      "a": [
        "Is fine",
        "Crashes — marshal to the UI thread first",
        "Is faster",
        "Queues automatically"
      ],
      "correct": 1,
      "expl": "UI frameworks are single-threaded; use the Dispatcher."
    }
  ]

};