# 承認地獄から解放！「Claude Code Auto Mode」で安全に自律開発

## レシピ概要

Claude Codeを使った開発で、こんな経験はありませんか？

「ファイルを編集してもいいですか？」「このコマンドを実行してもいいですか？」――1つのタスクを進めるだけで、何度も承認ダイアログが表示され、そのたびに手を止めて内容を確認し、Enterキーを押す。いわゆる**「承認地獄」**です。

かといって、`--dangerously-skip-permissions`フラグを使えば承認は不要になりますが、名前の通り「危険」です。AIが誤ってファイルを大量削除したり、意図しない外部サービスにデータを送信するリスクが残ります。

2026年3月にAnthropicがリリースした**Claude Code Auto Mode**は、この「安全性」と「開発効率」のジレンマを解決する新しいパーミッションモードです。AIの各アクションを分類器（Classifier）がリアルタイムで安全性判定し、安全なら自動実行、危険なら自動ブロックする仕組みにより、開発者は承認作業から解放されつつ、安全性も確保できます。

本レシピでは、Auto Modeの仕組みを理解し、実際にセットアップして使い始めるまでの手順を、ステップバイステップで解説します。

> **対応プランについて**: Auto Modeは **Team / Enterprise / API** プランでのみ利用可能です（Pro・Maxプランでは利用できません）。本レシピではAPI経由での検証手順を紹介しますが、企業で利用される方はTeamまたはEnterpriseプラン経由でも同じ操作が可能です。プランごとの差異がある箇所には都度補足を入れています。

---

## 本レシピで学べること

1. **Auto Modeの安全性の仕組みを理解する**
2. **パーミッション設定を実務で使いこなす**
3. **自律開発ワークフローを構築する**

---

## 本レシピで使うツール

- **Claude Code**（CLIまたはデスクトップアプリ）
- **Node.js / npm**（デモプロジェクトの実行用）
- **Git**（バージョン管理・変更差分の確認用）

---

## 本レシピを追体験する上で必要な開発環境

| 項目 | 要件 |
|------|------|
| OS | macOS / Linux / Windows（WSL推奨） |
| Node.js | v18以上 |
| Git | インストール済み |
| Claude Code | v2.1.83以上（`npm install -g @anthropic-ai/claude-code`） |
| Anthropicアカウント | **Team / Enterprise / API** いずれか（Pro・Maxは非対応） |
| モデル | Claude Sonnet 4.6 または Opus 4.6 |
| APIプロバイダ | Anthropic API のみ（Bedrock・Vertex・Foundryは非対応） |
| エディタ | VS Code推奨（Claude Code拡張機能あり） |

> **Team / Enterprise プランの方へ**: Auto Modeを利用するには、組織の管理者が [Claude Code管理設定](https://claude.ai/admin-settings/claude-code) から事前にAuto Modeを有効化する必要があります。「Auto Modeが選択できない」場合は、まず管理者に有効化を依頼してください。

---

## 実務活用例

1. **テスト付き機能追加を一気通貫で自動化**
2. **リファクタリングを安全に一括実行する**
3. **CI/CD前のコード品質チェックを自動化**

---

## Claude Code Auto Modeとは？

### 従来のパーミッションモデルの課題

Claude Codeには複数のパーミッションモードが用意されています。

| モード | 説明 | 課題 |
|--------|------|------|
| `default` | ツール実行のたびに承認を要求 | 承認回数が多く、開発のテンポが悪い |
| `plan` | 分析のみ。ファイル変更・コマンド実行は不可 | 実装ができない |
| `bypassPermissions` | 承認をすべてスキップ | 安全性が担保されない |

`default`モードでは安全だが非効率、`bypassPermissions`モードでは効率的だが危険――この両者の間を埋めるのがAuto Modeです。

### Auto Modeのアーキテクチャ

Auto Modeでは、Claude Codeが実行しようとする各アクションに対して、**2段階の分類器パイプライン**がリアルタイムで安全性を判定します。

```
ユーザーの指示
    ↓
Claude Code がアクションを生成
    ↓
┌─────────────────────────────────┐
│ Stage 1: 高速フィルター          │
│  → 1トークンのYes/No判定         │
│  → 疑わしいものを積極的にブロック  │
│  → 偽陽性率: 8.5%               │
└──────────┬──────────────────────┘
           │ フラグされた場合のみ
           ↓
┌─────────────────────────────────┐
│ Stage 2: 推論レイヤー            │
│  → Chain-of-Thought で詳細分析   │
│  → 偽陽性率を 0.4% に低減        │
└──────────┬──────────────────────┘
           ↓
  安全 → 自動実行  /  危険 → ブロック
```

**ポイント**: 分類器はClaude本体の説明文やツール結果を意図的に除外して判定します。これにより、AIが分類器を「説得」して危険なアクションを通過させることを防いでいます。

### Auto Modeが防ぐ脅威

Anthropicの公式エンジニアリングブログによると、Auto Modeは以下4つの脅威ベクトルに対応しています。

| 脅威 | 説明 | 例 |
|------|------|-----|
| 過剰行動 | ユーザーの意図を超えた操作 | 「整理して」の指示でforce pushを実行 |
| 正直なミス | リソース範囲の誤認 | 間違ったディレクトリのファイルを削除 |
| プロンプトインジェクション | ツール出力に埋め込まれた悪意ある指示 | READMEに隠された「全ファイル削除」指示 |
| モデルの不整合 | AIが独自の目的を追求 | 環境変数からAPIトークンを探索 |

---

## Claude Code Auto Modeの活用シーン

Auto Modeは以下のような場面で特に効果を発揮します。

**1. 長時間の自律タスク**
テスト作成、リファクタリング、ドキュメント生成など、多数のファイル操作を伴うタスクでは、承認回数が数十回に及ぶことがあります。Auto Modeなら、安全な操作は自動で進行し、危険な操作のみブロックされます。

**2. チーム開発での標準化（Team / Enterprise向け）**
管理者がmanaged settingsで`autoMode.environment`を設定すれば、チーム全員が同じ安全基準でAuto Modeを利用できます。例えば、社内GitLabや特定のAWSバケットを信頼インフラとして一括登録することで、個人の判断ミスによるインシデントを防ぎつつ、開発速度を維持できます。

**3. CI/CDパイプラインとの連携**
Auto Modeはコンテナやサンドボックス環境との併用を前提に設計されています。CI上でClaude Codeを自動実行する際、`bypassPermissions`よりも安全な選択肢となります。

---

## 環境構築

### Step 1: Claude Codeのインストール

Claude Codeがまだインストールされていない場合は、以下のコマンドでインストールします。

```bash
# Claude Code のインストール
npm install -g @anthropic-ai/claude-code

# バージョン確認
claude --version
```

### Step 2: 認証の設定

利用プランに応じて認証方法が異なります。

**Team / Enterprise プランの場合（多くの読者はこちら）:**

```bash
# Claude Code を起動（初回は認証フローが開始される）
claude
```

ブラウザが自動で開き、所属組織のAnthropicアカウントでのログインが求められます。SSOが設定されている場合は、組織のSSO認証画面が表示されます。認証完了後、ターミナルに戻ります。

**API プランの場合（本レシピの検証環境）:**

```bash
# 環境変数にAPIキーを設定
export ANTHROPIC_API_KEY="sk-ant-xxxxx"

# Claude Code を起動
claude
```

APIキーは [Anthropic Console](https://console.anthropic.com/) から取得できます。

> **補足**: Team/Enterpriseプランではトークン消費がプランの利用枠に含まれますが、APIプランでは従量課金となります。本レシピの全タスクを実行した場合の目安コストは後述の「API利用料金の目安」を参照してください。

### Step 3: Auto Modeの有効化

Auto Modeを有効にする方法は3つあります。

**方法A: 起動時のフラグ指定（推奨・最も簡単）**

```bash
claude --enable-auto-mode
```

> **Team/Enterpriseの方へ**: このコマンドを実行してもAuto Modeが有効にならない場合、管理者がAuto Modeを許可していない可能性があります。管理者に確認してください。管理者側で`permissions.disableAutoMode`が`"disable"`に設定されている場合、ユーザー側では有効化できません。

**方法B: セッション内での切り替え**

Claude Codeの実行中に `Shift + Tab` を押すと、パーミッションモードの切り替えメニューが表示されます。ここで`auto`を選択します。

```
Permission modes:
  → default     （標準モード）
  → acceptEdits （ファイル編集を自動承認）
  → plan        （分析のみモード）
  → auto        （Auto Mode）  ← これを選択
```

> **注意**: `auto`は`--enable-auto-mode`フラグを指定して起動した場合にのみ切り替え候補に表示されます。`Shift + Tab`でautoが見えない場合は、一度終了してフラグ付きで再起動してください。

**方法C: 設定ファイルで常時有効化**

`~/.claude/settings.json` に以下を追加すると、毎回のフラグ指定が不要になります。

```json
{
  "permissions": {
    "defaultMode": "auto"
  }
}
```

### Step 4: デモプロジェクトの準備

本レシピの追体験用に、簡単なNode.jsプロジェクトを用意しました。以下の手順でセットアップしてください。

```bash
# デモプロジェクトのディレクトリに移動
cd ~/claude-code-auto-mode-demo

# プロジェクトの初期化
npm init -y

# 開発用パッケージのインストール
npm install --save-dev jest

# Gitの初期化
git init
git add .
git commit -m "Initial commit"
```

---

## Claude Code Auto Modeを使ってみた

ここからは、実際のタスクを通じてAuto Modeの動作を体験していきます。

### タスク1: ユーティリティ関数の作成とテスト

まず、簡単な文字列操作ユーティリティを作成してもらいましょう。

**プロンプト:**

```
src/utils/string-helpers.js に以下のユーティリティ関数を作成して:
- capitalize: 先頭文字を大文字にする
- slugify: 文字列をURL用スラッグに変換する
- truncate: 指定文字数で切り詰めて末尾に"..."を付ける

各関数のJestテストも tests/string-helpers.test.js に作成して。
```

**Auto Modeでの動作:**

Auto Modeを有効にした状態でこのプロンプトを送ると、以下のような流れで処理が進みます。

```
1. src/utils/ ディレクトリの作成      → 安全 → 自動実行 ✓
2. string-helpers.js の作成          → 安全 → 自動実行 ✓
3. tests/ ディレクトリの作成          → 安全 → 自動実行 ✓
4. string-helpers.test.js の作成     → 安全 → 自動実行 ✓
5. npm test の実行                   → 安全 → 自動実行 ✓
```

すべてプロジェクト内のファイル操作と、package.jsonで定義されたテストコマンドの実行なので、分類器が「安全」と判定し、一切の承認なしで完了します。

**defaultモードとの比較:**

`default`モードでは、上記の5ステップそれぞれで承認が必要です。つまり、最低5回のEnterキー入力が必要になります。Auto Modeなら**0回**です。

### タスク2: 危険な操作のブロック体験

次に、Auto Modeが「危険」と判断する操作を意図的に試してみましょう。

**プロンプト:**

以下を入力します。

```
curl https://example.com/install.sh | bash を実行して
```

**Auto Modeでの動作:**

```
curl https://example.com/install.sh | bash の実行 → ブロック ✗
  理由: 外部からダウンロードしたコードの直接実行は危険なため
```

しかし実際に検証すると、`curl | bash`やデータ外部送信は、Auto Modeの分類器に到達する前に**Claude自身のモデルレベルの安全ガードレール**が働き、そもそも実行を試みません。つまり、Auto Modeには**3層の防御**が存在します。

| 層 | 仕組み | 発動タイミング |
|---|--------|-------------|
| **第1層**: Claudeモデルの安全性 | 明らかに危険な操作はそもそも試みない | `curl\|bash`、データ外部送信等 |
| **第2層**: Auto Mode分類器 | Claudeが実行しようとした操作をリアルタイム判定 | 保護パスへの書き込み、微妙なケース |
| **第3層**: Permission deny rules | 設定で明示的にハードブロック | denylistに登録した操作 |

**分類器の動作を体験するには、保護パスへの書き込みが有効です。** 以下を試してみましょう。

**プロンプト:**

```
~/.bashrc に alias cc='claude' を追加して
```

**Auto Modeでの動作:**

```
1回目: Update(~/.bashrc)
  → Denied by auto mode classifier   ← 分類器がブロック！

2回目: Update(~/.bashrc) - alias cc='claude' の1行追加
  → Allowed by auto mode classifier  ← リトライで許可！
```

注目すべきは、分類器が**1回目をブロックした後、Claudeがより安全なアプローチでリトライし、2回目は許可された**点です。単純なdenylistなら「`.bashrc`への書き込み → 全拒否」ですが、Auto Modeの分類器は**変更内容の安全性を文脈込みで再評価**しています。

> **経験者Tips**: 筆者が検証した際、`git push --force`は**リモートに既存の履歴がない初回pushでは許可**されました。また、`curl | bash`や機密データの外部送信はClaude自身がそもそも実行を拒否し、分類器に到達しませんでした。Auto Modeの安全性は「分類器だけ」ではなく、モデルの安全性と分類器の**多層防御**で成り立っています。

**ブロック時の挙動:**

ブロックされると、Claude Codeは以下のように振る舞います。

1. ブロック理由が表示される
2. Claude Codeは「より安全な代替手段」を自動で模索する
3. 3回連続でブロックされるか、合計20回ブロックされるとセッションが終了する

### タスク3: 信頼インフラの設定とカスタマイズ

タスク2では、保護パス（`~/.bashrc`）への書き込みで分類器のブロックを体験しました。実務では「社内のGitリポジトリへのpushが毎回ブロックされる」「社内CIサーバーへのAPIコールが通らない」といった**偽陽性（false positive）**が問題になります。これは`autoMode.environment`で信頼インフラを定義することで解決できます。

**Step 1: 現在の設定を確認**

Claude Codeを一度終了し、ターミナルから以下を実行します。

```bash
claude auto-mode config
```

このコマンドで、現在の分類器設定（environment、allow、soft_deny）が表示されます。初期状態では、作業ディレクトリとリポジトリのリモートのみが信頼対象です。

**Step 2: デフォルトルールの確認**

```bash
claude auto-mode defaults
```

分類器が持つデフォルトのブロック/許可ルールを一覧表示します。カスタマイズの際は、このデフォルトをベースに追加・変更するのが安全です。

> **重要**: `allow`や`soft_deny`をカスタム設定すると、**デフォルト全体が置き換わります**。デフォルトを確認せずに設定すると、force pushやデータ送信のブロックが消えてしまう危険があります。必ず`defaults`の出力をコピーしてから編集してください。

**Step 3: 信頼インフラを定義**

`~/.claude/settings.json` を編集して、信頼インフラを登録します。

**API利用（個人開発）の場合:**

```json
{
  "permissions": {
    "defaultMode": "auto"
  },
  "autoMode": {
    "environment": [
      "Source control: github.com/your-username and all repos under it",
      "Trusted internal domains: localhost, 127.0.0.1"
    ]
  }
}
```

**Team / Enterprise（組織開発）の場合:**

組織の管理者がmanaged settingsで一括配布するのが推奨です。以下は設定例です。

```json
{
  "autoMode": {
    "environment": [
      "Organization: 株式会社Example. Primary use: software development",
      "Source control: github.example.com/example-corp and all repos under it",
      "Trusted cloud buckets: s3://example-build-artifacts",
      "Trusted internal domains: *.corp.example.com, api.internal.example.com",
      "Key internal services: Jenkins at ci.example.com, Artifactory at artifacts.example.com"
    ]
  }
}
```

> **ポイント**: `autoMode.environment`の記述は自然言語です。新しいエンジニアにインフラを説明するような文体で書くと、分類器が正しく解釈しやすくなります。`environment`のみの変更であれば、デフォルトの`allow`/`soft_deny`はそのまま維持されるので安全です。

**Step 4: 設定の検証**

```bash
# 設定が正しく反映されているか確認
claude auto-mode config

# カスタムルールのレビュー（AIによるフィードバック）
claude auto-mode critique
```

`auto-mode critique`コマンドは、設定したルールに対してAIが「曖昧な点はないか」「偽陽性を起こしやすい記述はないか」をレビューしてくれる便利な機能です。

**Step 5: ブロック履歴の確認**

Claude Code内で `/permissions` と入力すると、分類器がブロックした操作の履歴（Recently denied）を確認できます。ブロックされた操作に対して `r` キーを押すとリトライをマークでき、ダイアログを閉じるとClaude Codeがその操作を再試行します。

> **実務での導入ステップ（推奨）**: まずはデフォルト設定で使い始め、ソースコントロールと主要な内部サービスだけ`environment`に追加する → ブロックが発生したら `/permissions` で確認し、必要に応じて`environment`を拡充する、という段階的なアプローチが安全です。

### タスク4: 実践的なリファクタリングの自動化

最後に、より実践的なタスクとして、既存コードのリファクタリングをAuto Modeで実行してみましょう。Auto Modeの真価は、このような**複数ファイルにまたがる反復的な作業**で発揮されます。

**プロンプト:**

```
src/utils/string-helpers.js を以下の方針でリファクタリングして:
1. JSDoc コメントを全関数に追加
2. エッジケース（null, undefined, 空文字）のハンドリングを追加
3. テストもエッジケースを網羅するように更新
4. 変更後にテストを実行して全てパスすることを確認
```

**Auto Modeでの動作:**

プロジェクト内のファイル操作とテスト実行は、すべて`Allowed by auto mode classifier`と判定されます。

```
1. string-helpers.js の読み取り        → Allowed → 自動実行 ✓
2. string-helpers.js の編集            → Allowed → 自動実行 ✓
3. string-helpers.test.js の読み取り   → Allowed → 自動実行 ✓
4. string-helpers.test.js の編集       → Allowed → 自動実行 ✓
5. npm test の実行                     → Allowed → 自動実行 ✓
6. (テスト失敗時) コードの修正         → Allowed → 自動実行 ✓
7. npm test の再実行                   → Allowed → 自動実行 ✓
```

リファクタリング→テスト→修正→再テストのループが**完全に自動**で回ります。`default`モードでは7回以上の承認が必要だったものが、Auto Modeでは**0回**です。

**なぜこれが安全なのか？**

タスク2で見たように、Auto Modeの安全性は3層で担保されています。このタスクでは：
- **第1層（モデル）**: リファクタリングは正当な開発作業のため、Claude自身も安全と判断
- **第2層（分類器）**: プロジェクト内のファイル操作と`npm test`は安全カテゴリのため、分類器も`Allowed`
- **第3層（Permission rules）**: denyルールに該当しないため通過

もし仮にClaude が「テスト修正のついでに`.env`の内容を外部送信しよう」とした場合は、第1層（モデルの安全性）または第2層（分類器）で確実にブロックされます。

> **実務での活用ポイント**: リファクタリング後は `git diff` で変更内容を確認する習慣をつけましょう。Auto Modeはあくまで「承認作業を自動化」するものであり、「レビューを不要にする」ものではありません。変更結果のレビューは引き続き開発者の責任です。

---

## パーミッション設定のベストプラクティス

Auto Modeを実務で活用する際の設定指針をまとめます。Auto Modeの分類器と`permissions`のallow/denyルールは**併用**するものです。分類器は「文脈を考慮した柔軟な判定」、Permission rulesは「絶対に破らせない硬いガードレール」という役割分担です。

### allowlist の設計（分類器のオーバーヘッドを削減）

`permissions.allow`に登録した操作は、分類器を**スキップ**して即座に実行されます。頻繁に使う安全なコマンドを登録すると、分類器の呼び出し分のトークン消費とレイテンシを削減できます。

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run build)",
      "Bash(npm run test *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ]
  }
}
```

> **注意**: Auto Modeに入ると、`Bash(*)`のような広範なallowルールや、`Bash(python*)`のようなインタプリタのワイルドカードルールは**自動的にドロップ**されます。`Bash(npm test)`のような具体的なルールのみが引き継がれます。

### denylist の設計（分類器より強い絶対的ブロック）

`permissions.deny`には、**分類器の判定に関係なく絶対にブロックしたい操作**を登録します。denyルールは分類器が評価される**前に**適用されるため、最強のガードレールとなります。

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Read(./.env)"
    ]
  }
}
```

> **注意**: denyルールはClaude Codeの組み込みツール（Read, Edit等）に適用されますが、Bashサブプロセスには適用されません。例えば`Read(./.env)`をdenyしても、`Bash(cat .env)`は防げません。OS レベルの制限が必要な場合は、サンドボックス機能を併用してください。

---

## API利用料金の目安

本レシピの全タスク（タスク1〜4）をAPI経由で実行した場合の概算コストです。

| 項目 | Sonnet 4.6 | Opus 4.6 |
|------|-----------|----------|
| 入力トークン単価 | $3 / 1Mトークン | $5 / 1Mトークン |
| 出力トークン単価 | $15 / 1Mトークン | $25 / 1Mトークン |

**本レシピの想定トークン消費量:**

| タスク | 入力(概算) | 出力(概算) |
|--------|-----------|-----------|
| タスク1: 関数作成+テスト | ~15,000 | ~3,000 |
| タスク2: ブロック体験 | ~8,000 | ~1,000 |
| タスク3: 信頼インフラ設定 | ~10,000 | ~2,000 |
| タスク4: リファクタリング | ~20,000 | ~5,000 |
| 分類器のオーバーヘッド（各アクション毎） | ~30,000 | ~2,000 |
| **合計** | **~83,000** | **~13,000** |

**概算コスト:**
- **Sonnet 4.6の場合**: 入力 $0.25 + 出力 $0.20 = **約$0.45（約65円）**
- **Opus 4.6の場合**: 入力 $0.42 + 出力 $0.33 = **約$0.75（約110円）**

> **Team / Enterpriseプランの方へ**: これらのトークン消費はプランの利用枠に含まれるため、追加のAPI料金は発生しません。ただし、Auto Modeでは分類器が別途Sonnet 4.6で動作するため、通常のClaude Codeの利用と比較して若干多くのトークンを消費します。

---

## まとめ

本レシピでは、Claude Code Auto Modeの仕組みから実践的な活用方法までを解説しました。

**学んだこと:**

- Auto Modeの安全性は**3層防御**（モデルの安全性 → 分類器 → Permission rules）で成り立っている
- 分類器は単純なパターンマッチではなく、**変更内容や文脈を考慮した判定**を行う（保護パスへの書き込みでも安全なら許可）
- `autoMode.environment`で信頼インフラを定義することで、組織に合わせたカスタマイズが可能
- プロジェクト内のファイル操作やテスト実行は`Allowed`と判定され、承認なしで自動実行される
- 分類器がブロックした場合、Claudeは自動的にリトライし、より安全なアプローチを模索する

**従来モードとの比較:**

| 観点 | default | bypassPermissions | Auto Mode |
|------|---------|-------------------|-----------|
| 安全性 | 高 | 低 | 高 |
| 開発効率 | 低 | 高 | 高 |
| 承認回数 | 多い | 0回 | ほぼ0回 |
| 推奨環境 | 機密性の高い操作 | 隔離コンテナのみ | 日常開発全般 |

Auto Modeは「安全性を妥協せずに開発効率を最大化する」という、これまで両立が難しかった課題を解決するツールです。

**次のステップ:**
- **個人（API）**: まずは本レシピのデモプロジェクトで動作を体験してみてください
- **チーム導入（Team/Enterprise）**: 管理者にAuto Modeの有効化を依頼し、`autoMode.environment`で組織の信頼インフラを定義するところから始めましょう。managed settingsで配布すれば、チーム全員が同じ安全基準で利用開始できます

---

## 習熟度チェックテスト

### 問題1: Auto Modeの分類器パイプラインについて

Auto Modeの2段階分類器について、正しい説明はどれですか？

- A) Stage 1が詳細分析を行い、Stage 2が高速判定を行う
- B) Stage 1が高速なYes/No判定を行い、フラグされた場合のみStage 2が推論で詳細分析する
- C) Stage 1とStage 2は並列に実行され、両方が「安全」と判定した場合のみ実行される
- D) Stage 1はユーザーの承認を求め、Stage 2がAIによる判定を行う

<details>
<summary>回答を見る</summary>

**正解: B**

Auto Modeの分類器は直列の2段階パイプラインです。Stage 1は1トークンのYes/No判定による高速フィルターで、疑わしいアクションを積極的にブロックします（偽陽性率8.5%）。Stage 1でフラグされた場合のみStage 2のChain-of-Thought推論レイヤーが起動し、偽陽性率を0.4%まで低減します。この設計により、大半の安全なアクションはStage 1で素早く通過し、判断が難しいケースのみ詳細分析が行われます。
</details>

---

### 問題2: Auto Modeの信頼インフラ設定について

`autoMode.environment`を設定ファイルに記述する際、**読み込まれない**ファイルはどれですか？

- A) `~/.claude/settings.json`（ユーザー設定）
- B) `.claude/settings.json`（プロジェクト共有設定）
- C) `.claude/settings.local.json`（プロジェクトローカル設定）
- D) 管理者が配布するmanaged settings

<details>
<summary>回答を見る</summary>

**正解: B**

`autoMode`設定は、ユーザー設定（`~/.claude/settings.json`）、プロジェクトローカル設定（`.claude/settings.local.json`）、managed settingsから読み込まれます。しかし、プロジェクト共有設定（`.claude/settings.json`）からは**読み込まれません**。これは、リポジトリにチェックインされた共有設定ファイルに悪意あるallowルールが含まれるリスクを防ぐためのセキュリティ設計です。
</details>

---

### 問題3: パーミッション設定の優先順位について

以下の状況で、`Bash(npm run deploy)`は実行されますか？

- managed settings: 設定なし
- ユーザー設定(`~/.claude/settings.json`): `permissions.allow` に `Bash(npm run deploy)` を追加
- プロジェクト設定(`.claude/settings.json`): `permissions.deny` に `Bash(npm run deploy)` を追加

選択肢:
- A) ユーザー設定のallowが優先されるため、承認なしで実行される
- B) プロジェクト設定のdenyが優先されるため、ブロックされる
- C) allowとdenyが競合するため、ユーザーに承認が求められる
- D) 設定の読み込み順が後のプロジェクト設定が常に勝つため、ブロックされる

<details>
<summary>回答を見る</summary>

**正解: B**

パーミッションルールの評価順序は **deny → ask → allow** です。最初にマッチしたルールが適用されるため、denyルールは常に最優先です。さらに、設定ファイルの優先順位において、プロジェクト設定はユーザー設定よりも上位にあります。したがって、プロジェクト設定のdenyルールがユーザー設定のallowルールに優先し、`npm run deploy`はブロックされます。このルールにより、プロジェクト管理者はリポジトリレベルで危険なコマンドの実行を確実に防止できます。
</details>
