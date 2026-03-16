# 🏭 DynaMFG — DynamoDB for Manufacturing

An interactive data modeler and query playground for exploring DynamoDB with industrial/manufacturing workloads.

Design schemas for sensor telemetry, asset hierarchies, alarms, work orders, and more — then run real queries to see how they perform.

## Features

- 🏭 **6 pre-built industrial data models** — asset hierarchy (ISA-95), sensor telemetry, alarms, work orders, batch genealogy, OEE metrics
- 🔍 **Interactive query playground** — write queries, see results + consumed RCUs + scan vs query efficiency warnings
- 📊 **Partition key visualizer** — bar chart showing item distribution with hot partition detection
- 🎯 **7 guided challenges** — hands-on exercises from beginner to advanced with hints and solutions
- 📦 **Raw data browser** — browse all items across all tables
- 🚀 **Schema export** — generate CloudFormation JSON or CDK TypeScript for any model
- ☁️ **Dual mode** — runs against DynamoDB Local (no AWS account needed) or your real AWS account

## Data Models

| Model | Category | Pattern Taught |
|-------|----------|---------------|
| Asset Hierarchy | Asset Management | Adjacency list, single-table design |
| Sensor Telemetry | Time Series | Time-bucketed partition keys, write sharding |
| Alarm & Event Log | Events | Sparse GSI, severity-based indexing |
| Work Orders | Maintenance | Dual GSI (status + technician) |
| Batch Genealogy | Traceability | Forward/reverse trace with inverted GSI |
| OEE Metrics | Analytics | Pre-aggregation pattern (shift/day rollups) |

## Quick Start (Local Mode)

Requires Node.js and Java (for DynamoDB Local).

```bash
# Install dependencies
npm install

# Start DynamoDB Local (downloads JAR on first run)
npm run db -w server

# In a second terminal — seed data and start the app
npm run seed
npm run dev
```

Open http://localhost:5173

### Using Docker instead

If you have Docker installed, you can use it instead of the Java-based local DB:

```bash
docker compose up -d
npm install
npm run seed
npm run dev
```

## Using a Real AWS Account

To run against your actual AWS account instead of DynamoDB Local:

1. Make sure your AWS credentials are configured (`aws configure` or env vars)
2. Edit `server/.env`:
   ```bash
   # Comment out or remove this line:
   # DYNAMODB_ENDPOINT=http://localhost:8000

   # Set your region:
   AWS_REGION=us-east-1
   ```
3. Run `npm run seed` — you'll get a 5-second warning before tables are created
4. Run `npm run dev` as usual

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express API (thin layer over DynamoDB)
- **Database**: DynamoDB Local (Docker or npm) / AWS DynamoDB

## Project Structure

```
dynamfg/
├── server/
│   └── src/
│       ├── db.ts              # DynamoDB client (local or AWS)
│       ├── index.ts           # Express API
│       ├── seed.ts            # Table creation + sample data
│       ├── local-db.ts        # DynamoDB Local launcher
│       └── models/            # 6 industrial data models
└── client/
    └── src/
        ├── App.tsx            # Explore / Challenges / Raw Data modes
        ├── challenges.ts      # 7 guided query exercises
        └── components/        # UI components
```

## License

MIT
