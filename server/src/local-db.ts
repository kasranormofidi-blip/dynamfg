import dynamoLocal from "dynamodb-local";

const port = 8000;
console.log(`🗄️  Starting DynamoDB Local on port ${port}...`);
dynamoLocal.launch(port, null, ["-sharedDb", "-inMemory"]).then(() => {
  console.log(`✓ DynamoDB Local running on http://localhost:${port}`);
});
