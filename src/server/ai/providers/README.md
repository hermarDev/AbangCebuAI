# Installed provider adapters

AI SDK, @ai-sdk/amazon-bedrock, @ai-sdk/groq, and the AWS credential-provider
package are installed and pinned in package-lock.json. No model invocation,
fallback router, or public chat endpoint is implemented in this foundation.

During the agent milestone, use createAmazonBedrock with credentialProvider:
fromNodeProviderChain() for EC2 instance-role credentials. Use createGroq with
a server-side key. Select model IDs from the actual enabled account/region.
Provider/model selection alone must not enable billable fallback.

Implement the bounded agent, reviewed database tools, usage reservations,
eligibility checks, and fallback tests together before exposing /api/chat.
See the vault's AI Providers and EC2 Deployment note for the agreed constraints.
