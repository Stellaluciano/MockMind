# Interview Question Bank (Fixed File)

> The **fixed/canonical question bank file** in this repository is: `QUESTION_BANK.md`.
>
> For all future additions, edits, or removals, update this file directly.

## How to Use

- Option 1: Edit this file manually (recommended)
  - Maintain categories, difficulty, key points, and answer guidance directly here.
- Option 2: Sync/reference from the external bank
  - Source: <https://github.com/Stellaluciano/LLM-Interview-Question-Bank/blob/main/QUESTION_BANK.md>

## Recommended Question Format

```md
### [Category] Question title
- Difficulty: Beginner / Intermediate / Advanced
- Key points: ...
- Suggested answer: ...
- Follow-up: ...
```

---

## LLM Fundamentals

### [Core Concepts] What is Self-Attention in a Transformer?
- Difficulty: Beginner
- Key points: Q/K/V, scaled dot-product attention, contextual representation, parallelization.
- Suggested answer: Self-Attention computes similarity between Query and Key vectors to weight Value vectors, enabling each token to aggregate relevant context dynamically.
- Follow-up: Why divide by \(\sqrt{d_k}\)?

### [Training Objective] Why is next-token prediction commonly used for LLM pretraining?
- Difficulty: Beginner
- Key points: self-supervision, transferable representations, scalable data creation.
- Suggested answer: Next-token prediction allows training on large unlabeled corpora, learning broad language patterns and knowledge representations that transfer to many downstream tasks.
- Follow-up: How does this objective constrain or enable reasoning ability?

## LLM Engineering

### [Inference Optimization] What is the role of KV Cache?
- Difficulty: Intermediate
- Key points: avoid repeated computation, lower latency, memory/throughput trade-offs.
- Suggested answer: In autoregressive decoding, KV Cache stores historical key/value tensors so each new token step avoids recomputing prior attention projections, significantly improving inference speed.
- Follow-up: How do paged or chunked KV cache strategies help with long-context serving?

### [RAG Design] When is RAG not a good fit?
- Difficulty: Intermediate
- Key points: task knowledge dependency, retrieval noise, latency and system complexity costs.
- Suggested answer: RAG may underperform when tasks do not rely on external knowledge, retrieval quality is unstable, or strict latency budgets make retrieval overhead too expensive.
- Follow-up: How do you measure the net benefit of adding RAG?

## Safety and Evaluation

### [Safety] What are common defenses against prompt injection?
- Difficulty: Intermediate
- Key points: input handling, least-privilege tool access, policy layering, output validation.
- Suggested answer: Effective defenses include separating instruction layers, isolating tool execution, enforcing least privilege, partitioning trusted/untrusted context, and adding confirmation gates for sensitive actions.
- Follow-up: How do you detect indirect injection from retrieved documents?

### [Evaluation] How do you design a sustainable LLM evaluation set?
- Difficulty: Advanced
- Key points: coverage, versioning, automated regression checks, human audits.
- Suggested answer: Use a layered benchmark (core, scenario, adversarial), maintain a versioned stable subset plus rotating samples, and combine offline metrics with online behavioral monitoring.
- Follow-up: How do you prevent leaderboard-style overfitting to the eval set?
