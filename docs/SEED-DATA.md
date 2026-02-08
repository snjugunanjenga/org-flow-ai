# Seed Data

## Overview

The demo org is pre-loaded with realistic organizational data to showcase all features.

## Data Volumes

| Entity | Count |
|--------|-------|
| Organizations | 1 (demo) |
| Teams | 8 |
| People | ~150 |
| Messages | ~2,000 |
| Meeting Transcripts | ~20 |
| Meeting Summaries | ~20 |
| Topics/Decisions | ~50 |
| Projects | 3-4 |
| Pre-seeded Conflicts | 5-8 |

## Teams

1. **Engineering** (color: blue)
2. **Product** (color: purple)
3. **Design** (color: pink)
4. **Sales** (color: green)
5. **Marketing** (color: orange)
6. **Legal** (color: gray)
7. **HR** (color: teal)
8. **Operations** (color: amber)

## Sample Projects

1. **Platform v2.0 Migration** — Active, 60% complete, 3 milestones
2. **Q1 Product Launch** — Active, 40% complete, cross-team
3. **Compliance Audit** — On-hold, blocked by legal review
4. **Customer Onboarding Redesign** — Completed reference project

## Pre-seeded Conflicts

- Engineering decided on PostgreSQL; Product docs reference MongoDB
- Marketing launch date conflicts with Engineering sprint deadline
- Two meeting summaries with contradictory priority rankings
- Stalled project with no updates in 14 days

## Embeddings

All messages, transcripts, summaries, and decisions have pre-generated embeddings (1536-dim, text-embedding-3-small) loaded into Pinecone namespace `org_demo`.
