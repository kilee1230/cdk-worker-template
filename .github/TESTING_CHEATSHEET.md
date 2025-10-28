# Lambda Local Testing - Quick Reference

## 🚀 Quick Commands

### Interactive Testing (Fastest)

```bash
npm run test:lambda              # Run all test scenarios
npm run test:lambda simple       # Test simple message
npm run test:lambda sns          # Test SNS-wrapped message
npm run test:lambda batch        # Test batch processing
npm run test:lambda failure      # Test error handling
npm run test:lambda partial      # Test partial batch failure
```

### Unit Tests

```bash
npm test                         # Run all tests
npm test lambda-worker           # Run Lambda tests only
npm run test:watch               # Watch mode
npm run test:coverage            # With coverage
```

### AWS SAM CLI (Most Realistic)

```bash
# First time setup
brew install aws-sam-cli
npm run synth

# Run tests
sam local invoke WorkerFunction \
  --template template-local.yaml \
  --event events/sqs-event.json
```

## 📁 Files Added

```
cdk-worker-template/
├── events/                              # Test event files
│   ├── sqs-event.json                   # Single message
│   ├── sqs-batch-event.json             # Batch of messages
│   └── sns-wrapped-event.json           # SNS → SQS message
├── scripts/
│   └── test-lambda-local.ts             # Interactive test script
├── test/
│   └── lambda-worker.test.ts            # Vitest unit tests
├── template-local.yaml                  # SAM template
└── LOCAL_TESTING.md                     # Detailed guide
```

## 🎯 Test Scenarios

| Scenario  | What It Tests            | Expected Result           |
| --------- | ------------------------ | ------------------------- |
| `simple`  | Basic message processing | ✅ Success                |
| `sns`     | SNS-wrapped messages     | ✅ Success (unwrapped)    |
| `batch`   | Multiple messages        | ✅ All succeed            |
| `failure` | Error handling           | ⚠️ 1 failure              |
| `partial` | Mixed success/failure    | ⚠️ Only failures returned |

## 🔧 Development Workflow

1. **Write/modify Lambda code** in `src/lambda/worker/index.ts`
2. **Test locally** with `npm run test:lambda`
3. **Run unit tests** with `npm test`
4. **Deploy** with `npm run deploy`
5. **Test in AWS** with SNS/SQS

## 🐛 Debugging

### Enable Debug Logging

Edit `scripts/test-lambda-local.ts`:

```typescript
process.env.LOG_LEVEL = "debug";
```

### VS Code Debugger

1. Press F5 → Select "Debug Lambda Test"
2. Set breakpoints in `src/lambda/worker/index.ts`
3. Run test

### Check Test Logs

All tests output structured JSON logs with:

- Request ID
- Function name
- Message details
- Error information

## 💡 Pro Tips

- Use **Interactive Script** for rapid iteration
- Write **Vitest tests** for CI/CD
- Use **SAM CLI** before production deploys
- Test all scenarios (happy path + errors)
- Check coverage: `npm run test:coverage`

## 📚 Documentation

- Full guide: [LOCAL_TESTING.md](../LOCAL_TESTING.md)
- Main README: [README.md](../README.md)
