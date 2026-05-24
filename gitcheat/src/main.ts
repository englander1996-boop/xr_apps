import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const TIPS: [string, string][] = [
  ['git restore --staged FILE', 'unstage but keep changes'],
  ['git restore FILE', 'discard unstaged changes (DESTRUCTIVE)'],
  ['git stash -u', 'stash including untracked files'],
  ['git stash pop', 'reapply latest stash and drop it'],
  ['git rebase -i HEAD~N', 'interactive rebase last N commits'],
  ['git commit --amend --no-edit', 'amend last commit, keep msg'],
  ['git reflog', 'history of HEAD moves; can undo anything'],
  ['git switch -c NAME', 'create + checkout new branch'],
  ['git cherry-pick SHA', 'apply one commit from elsewhere'],
  ['git log --oneline --graph --all', 'pretty branch graph'],
  ['git diff --staged', 'diff what is about to be committed'],
  ['git bisect start; git bisect bad; git bisect good SHA', 'binary search for the bug'],
  ['git push --force-with-lease', 'safer force push'],
  ['git clean -fd', 'remove untracked files & dirs (DESTRUCTIVE)'],
  ['git remote -v', 'show remote URLs'],
  ['git fetch --prune', 'fetch and delete stale remote branches'],
  ['git blame -L 10,20 FILE', 'blame just lines 10-20'],
  ['git show HEAD:FILE', 'cat a file at HEAD'],
]
let idx = 0
const preview = setupPreview({
  title: 'Git Cheat',
  subtitle: 'Tap=next, double=random',
  buttons: [
    { id: 'next', label: 'Next', onClick: () => { idx = (idx + 1) % TIPS.length; render() } },
    { id: 'rand', label: 'Random', variant: 'secondary', onClick: () => { idx = Math.floor(Math.random() * TIPS.length); render() } },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => { idx = (idx + 1) % TIPS.length; render() })
app.on('double', () => { idx = Math.floor(Math.random() * TIPS.length); render() })

function render() {
  const [k, v] = TIPS[idx]
  preview.setContent(`${k}\n${v}\n(${idx + 1}/${TIPS.length})`)
  void app.render(lines(k, v))
}
render()
