import type { Workshop, UserProfile } from '../types';

export const INITIAL_WORKSHOPS: Workshop[] = [
  {
    id: 'wk-1',
    title: 'Autonomous Multi-Agent Swarms with LangGraph',
    eyebrow: 'PRODUCTION PATTERNS',
    shortDescription: 'Build self-correcting agent swarms with memory persistence, human-in-the-loop gates, and tool routing.',
    fullDescription: 'In this intensive 90-minute live build, we will construct an enterprise-grade multi-agent swarm using LangGraph. We will model supervisor agents, worker agents with specialized toolsets, implement state checkpointing in PostgreSQL, and build interactive human-in-the-loop approval gates for mission-critical tasks.',
    host: {
      name: 'Jerrin Anto',
      role: 'Lead Architect',
      organization: 'F1 Forge',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    domain: 'AGENTS',
    domainLabel: 'AI Agents',
    mode: 'Online — Google Meet',
    meetUrl: 'https://meet.google.com/xyz-work-ify',
    dateTime: 'Tomorrow at 6:30 PM IST',
    startsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    durationMinutes: 90,
    tags: ['LangGraph', 'Python', 'Agentic Workflows', 'State Graph'],
    prerequisites: ['Basic Python proficiency', 'Familiarity with LLM APIs', 'Docker installed locally'],
    agenda: [
      { time: '00:00 - 00:20', title: 'Architecture Breakdown', summary: 'State graphs vs DAGs, cyclical execution models, and state schemas.' },
      { time: '00:20 - 01:00', title: 'Live Code Along', summary: 'Coding the supervisor, research agent, and code synthesis agent.' },
      { time: '01:00 - 01:20', title: 'Human-in-the-Loop & Persistence', summary: 'Adding interruption points, state recovery, and memory.' },
      { time: '01:20 - 01:30', title: 'Build Submission & Proof Setup', summary: 'Deploying the agent swarm endpoint and claiming verified workshop proof.' }
    ],
    attendeesCount: 42,
    maxAttendees: 60,
    level: 'Intermediate',
    featured: true
  },
  {
    id: 'wk-2',
    title: 'High-Throughput Enterprise RAG with Hybrid Vector Search',
    eyebrow: 'GENAI INFRASTRUCTURE',
    shortDescription: 'Implement reciprocal rank fusion, chunk reranking, and semantic caching for production document Q&A.',
    fullDescription: 'Pure vector similarity often fails on tabular data, product IDs, and domain nuances. In this session, we construct a hybrid search pipeline combining BM25 keyword matching and dense vector embeddings, orchestrated with Cross-Encoder reranking and semantic response caching.',
    host: {
      name: 'Alex Rivera',
      role: 'AI Infrastructure Eng',
      organization: 'Hyperscale Labs',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    domain: 'GEN_AI',
    domainLabel: 'Generative AI',
    mode: 'Online — Google Meet',
    meetUrl: 'https://meet.google.com/abc-rag-flow',
    dateTime: 'Thursday at 7:00 PM IST',
    startsAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    durationMinutes: 75,
    tags: ['Hybrid Search', 'Rerankers', 'Vector DB', 'TypeScript'],
    prerequisites: ['Familiarity with embeddings', 'Node.js or Python environment'],
    agenda: [
      { time: '00:00 - 00:15', title: 'Why Simple RAG Breaks in Prod', summary: 'Case studies of embedding retrieval failures.' },
      { time: '00:15 - 00:50', title: 'Implementing Hybrid Retrieval', summary: 'Building the BM25 + Vector reciprocal fusion pipeline.' },
      { time: '00:50 - 01:15', title: 'Cohere Rerank & Latency Benchmarks', summary: 'Pruning false positives with neural reranking.' }
    ],
    attendeesCount: 28,
    maxAttendees: 50,
    level: 'Intermediate',
    featured: false
  },
  {
    id: 'wk-3',
    title: 'Autonomous Code Refactoring Agent with AST & Git API',
    eyebrow: 'DEVELOPER AUTOMATION',
    shortDescription: 'Build a CLI agent that parses syntax trees, generates non-destructive diffs, and opens verified PRs.',
    fullDescription: 'Stop asking chatbots to rewrite entire files. Learn how to write deterministic tools that query AST nodes, calculate exact line replacement chunks, and run local linter checks before committing code.',
    host: {
      name: 'Elena Rostova',
      role: 'Staff Tools Engineer',
      organization: 'DevForge AI',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    domain: 'AUTOMATION',
    domainLabel: 'Automation',
    mode: 'Online — Google Meet',
    meetUrl: 'https://meet.google.com/ast-code-gen',
    dateTime: 'Saturday at 5:00 PM IST',
    startsAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    durationMinutes: 90,
    tags: ['AST', 'Code Agents', 'Git Automation', 'TypeScript'],
    prerequisites: ['Command-line basics', 'Git fundamentals', 'Node 18+'],
    agenda: [
      { time: '00:00 - 00:25', title: 'Abstract Syntax Tree Primer', summary: 'Walking AST nodes without breaking code integrity.' },
      { time: '00:25 - 01:05', title: 'Unified Diff Generation', summary: 'Creating surgical patches with multi-replacement validation.' },
      { time: '01:05 - 01:30', title: 'Autonomous Git Branch & PR Workflow', summary: 'Automating the end-to-end pull request cycle.' }
    ],
    attendeesCount: 35,
    maxAttendees: 40,
    level: 'Advanced',
    featured: true
  },
  {
    id: 'wk-4',
    title: 'Deploying Local SLMs with WebGPU and Transformers.js',
    eyebrow: 'BROWSER EDGE AI',
    shortDescription: 'Run 1B-3B parameter quantized models directly in the user browser without cloud inference costs.',
    fullDescription: 'Unlock private, zero-latency inference directly on client GPUs. We will set up WebGPU acceleration, load ONNX quantized models (Qwen 2.5 and Llama 3.2), and stream responses into client React state.',
    host: {
      name: 'Marcus Chen',
      role: 'Client Runtime Eng',
      organization: 'EdgeCompute Open',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    domain: 'CLOUD',
    domainLabel: 'Cloud & Edge',
    mode: 'Online — Google Meet',
    meetUrl: 'https://meet.google.com/edge-gpu-ai',
    dateTime: 'Next Monday at 8:00 PM IST',
    startsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    durationMinutes: 60,
    tags: ['WebGPU', 'ONNX', 'Local AI', 'React'],
    prerequisites: ['Modern Chromium browser with WebGPU enabled', 'React knowledge'],
    agenda: [
      { time: '00:00 - 00:15', title: 'WebGPU Architecture for Neural Nets', summary: 'How shaders execute tensor arithmetic in browser memory.' },
      { time: '00:15 - 00:45', title: 'Streaming Model Inference', summary: 'Chunked weight downloading and token-by-token streaming.' },
      { time: '00:45 - 01:00', title: 'Building the Client Chat UI', summary: 'Connecting web worker threads with UI state.' }
    ],
    attendeesCount: 19,
    maxAttendees: 45,
    level: 'Intermediate',
    featured: false
  }
];

export const INITIAL_USER: UserProfile = {
  id: 'usr-101',
  name: 'Jerrin Anto',
  handle: '@jerrin-anto',
  headline: 'AI Engineer & Builder · Lead at F1 Forge',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bio: 'Building practical technology experiences and AI-native developer tooling. Passionate about multi-agent swarms, AST code transformation, and verifiable student proofs.',
  location: 'Bengaluru, India',
  companyOrSchool: 'F1 Forge',
  verifiedId: 'WF-7749-AUTH-2026',
  skills: [
    'Autonomous Multi-Agent Systems',
    'LangGraph Architecture',
    'TypeScript & React 19',
    'Python & FastAPI',
    'Hybrid Vector Search',
    'Vite & Tailwind CSS',
    'Google Cloud & Vertex AI'
  ],
  credentials: [
    {
      id: 'cred-01',
      title: 'LangGraph Autonomous Multi-Agent Swarms',
      issuer: 'Workify Academy & F1 Forge',
      dateAwarded: 'September 2026',
      hash: '0x8f2d...4a19c9',
      skills: ['LangGraph', 'Agentic Workflows', 'Human-in-the-Loop'],
      badgeType: 'GOLD'
    },
    {
      id: 'cred-02',
      title: 'Enterprise RAG & Hybrid Retrieval Engineer',
      issuer: 'Workify Verified Proofs',
      dateAwarded: 'August 2026',
      hash: '0x3c71...99e821',
      skills: ['Reciprocal Rank Fusion', 'Vector DB', 'Cohere Rerank'],
      badgeType: 'VERIFIED'
    }
  ],
  links: {
    linkedin: 'https://linkedin.com',
    portfolio: 'https://jerrin-ai.onrender.com'
  }
};
