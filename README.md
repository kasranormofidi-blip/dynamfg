# DynaMFG — DynamoDB for Manufacturing

An interactive data modeler and query playground for exploring DynamoDB with industrial/manufacturing workloads.

Design schemas for sensor telemetry, asset hierarchies, alarms, work orders, and more — then run real queries against DynamoDB Local to see how they perform.

## Features

- 🏭 Pre-built industrial data models (telemetry, asset trees, alarms, OEE)
- 🔍 Interactive query playground with capacity consumption feedback
- 📊 Partition key distribution visualizer
- ⏱️ Time-series partitioning strategies (write sharding, time bucketing)
- 📦 Export schemas to CloudFormation/CDK
- 🐳 Runs entirely local — no AWS account needed

## Quick Start (Local Mode)

```bash
# Start DynamoDB Local
docker compose up -d

# Install dependencies
npm install

# Seed sample data
npm run seed

# Start dev server
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

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express API (thin layer over DynamoDB Local)
- **Database**: DynamoDB Local (Docker)
- **UI**: Tailwind CSS

## License

MIT
