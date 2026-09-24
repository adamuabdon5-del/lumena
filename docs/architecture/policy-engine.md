# PolicyEngine Architecture

Lumen's \`PolicyEngine\` evaluates every transaction before co-signing to protect user funds:

- **Spend Limits**: Per-transaction and daily ceilings evaluated per asset (e.g. XLM vs USDC).
- **Multi-Op Checking**: Sums amounts across all payment operations in the transaction.
- **Allowlists**: Verifies all payment and path payment destinations against approved addresses.
- **Velocity Limits**: Caps the number of transactions permitted within sliding time windows.
- **Session Keys**: Enforces expiration timestamps and cumulative spend allowances for delegated keys.

## Session Key Rejection Webhook

When \`PolicyEngine.evaluateSessionKey()\` rejects a session key, the engine dispatches a
\`session_key.rejected\` webhook event so operators can monitor delegated key activity.

Rejections are emitted for both causes:

- **Expired key**: the session key's \`expiresAt\` timestamp has passed.
- **Spend cap exceeded**: the session key's cumulative spend allowance would be exceeded.

The event payload includes:

- \`sessionPublicKey\`: the public key of the rejected session key.
- \`walletAddress\`: the wallet address the session key was delegated for.
- \`reason\`: the rejection reason (e.g. expired or spend cap exceeded).

\`session_key.rejected\` is a member of the \`WebhookEventType\` union, so subscribers can
filter for it alongside other webhook events.
